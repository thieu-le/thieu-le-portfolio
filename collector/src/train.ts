// Daily retrain of the win probability model from otp_wp_samples. See docs/WPA.md.
//
// 1 in 10 matches (by hashed match ID) is held out to measure accuracy and
// calibration; the stored model is then refit on every sample.

import { config } from './config.ts';
import { select, upsert } from './db.ts';
import { log } from './log.ts';
import { evaluate, features, fitLogistic, hash, predict, type State } from './winprob.ts';

type SampleRow = { match_id: string; state: State; win: boolean };

export async function trainWinModel(): Promise<void> {
  const [latest] = await select<{ trained_at: string }>('otp_wp_model', 'select=trained_at&order=trained_at.desc&limit=1');
  if (latest && Date.now() - Date.parse(latest.trained_at) < config.wpRetrainHours * 3_600_000) return;

  const rows = await select<SampleRow>('otp_wp_samples', 'select=match_id,state,win&order=id');
  if (rows.length < config.wpMinSamples) {
    log.info(`Win probability model: ${rows.length}/${config.wpMinSamples} samples, not training yet`);
    return;
  }

  const X = rows.map((r) => features(r.state));
  const y = rows.map((r) => (r.win ? 1 : 0));
  const test = rows.map((r) => hash(r.match_id) % 10 === 0);

  const train = fitLogistic(X.filter((_, i) => !test[i]), y.filter((_, i) => !test[i]));
  const heldOut = rows.flatMap((r, i) => (test[i] ? [i] : []));
  const score = evaluate(heldOut.map((i) => predict(train.coef, rows[i].state)), heldOut.map((i) => y[i]));

  const full = fitLogistic(X, y);
  await upsert('otp_wp_model', [{
    coef: full.coef,
    samples: rows.length,
    accuracy: score.accuracy,
    ece: score.ece,
    log_loss: score.logLoss,
  }]);
  log.info(
    `Win probability model: ${rows.length} samples, held-out accuracy ${(100 * score.accuracy).toFixed(1)}%, ` +
      `ECE ${(100 * score.ece).toFixed(2)}%, log loss ${score.logLoss.toFixed(3)} (${full.iterations} iterations)`,
  );
}
