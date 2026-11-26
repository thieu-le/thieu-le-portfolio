# Win probability added (WPA)

How the One-Trick Stats site (`/otp`) measures what a build or a lane is actually
worth, instead of trusting raw win rate.

The method is adapted from xPetu, *Win probability estimation for strategic
decision-making in esports* (Master's thesis, 2024, CC BY-NC-SA 4.0). We use the
method only, not the thesis text or figures, and credit it on the page.

## The problem with win rate

Players choose items based on how the game is going. Some items are bought when
already ahead (Heartsteel in the thesis), others as a last resort. Their win rates
mostly reflect the situations they are bought in, not what the item does. The
thesis's Shen example: Heartsteel had the best win rate (54.2%) but was bought at a
53.7% average win chance, so it added only +0.7%. Titanic Hydra added +1.5%.

## The method

1. **A win probability model** `w(x) ≈ P(win | game state x)`.
2. **Win probability added** for one action:
   `ΔW = w(z) − w(x)`, where `x` is the state when the action took effect and `z`
   the state when its effect ended. For an item kept until the end of the game, `z`
   is the end of the game and `w(z)` is the result (1 or 0), so `ΔW = result − w(x)`.
3. **Average over many games**, because one game's ΔW is mostly noise:
   - `W̄` = mean `w(x)`: the context. Above 50% means the action is usually taken while ahead.
   - `ΔW̄` = mean ΔW: the WPA. Above 0 means taking it helps on average.

The thesis then picks `argmax ΔW̄` among the options for states similar to the
current one. We show ΔW̄ next to win rate and let the reader decide.

## What we compute

| Number | Where | Formula | Meaning |
|---|---|---|---|
| Build WPA | Core build card, matchup builds | `(wins − Σw(x_core)) / games` | `x_core` = state when the first of the 3 core items was bought |
| Win chance at purchase | Tooltip on build WPA | `Σw(x_core) / games` | Over 53% "usually bought ahead", under 47% "usually bought behind" |
| Lane WPA | Matchup table, matchup detail | `Σw(x_15) / games − 0.5` | How far the laning phase moved the game. Hardest and easiest sort by it (shrunk toward 0 with 10 phantom even games) |

All are shown in percentage points. Small samples (under 20 games with a state)
are marked `*`.

### Game state

One team's view of the game at a moment, every count being *this team minus the
enemy* (`collector/src/winprob.ts`, `teamState`):

```
[minute, gold, xp, kills, towers, dragons, grubs, heralds, barons, inhibitors, elders]
```

- Gold and XP are team totals from the last per-minute timeline frame at or before the moment.
- Kills, buildings and monsters are counted from timeline events up to that moment.
  `CHAMPION_KILL` credits the victim's enemy (so executions count). `BUILDING_KILL.teamId`
  is the team that *lost* the building. Elder dragons are counted apart from other dragons.
- Riot's API gives one frame per minute, so gold and XP can be up to 59 s stale.

### Model

Logistic regression with no intercept. Every input is a difference, so the model is
symmetric: the mirrored state always gets exactly `1 − w`. Features
(`features()` in TS, `otp_wp_eval()` in SQL; **the two must stay identical**):

```
t = minute / 30, g = gold / 1000, x = xp / 1000
[g, g·t, x, x·t, kills, towers, dragons, grubs, heralds, barons, inhibitors, elders]
```

The `·t` terms let a gold lead mean something different at 10 minutes than at 35.
The thesis used a deep network with player positions and per-player stats and
reached 75.9% accuracy with 0.9% expected calibration error (ECE). Published
logistic models for LoL reach about 73–75% accuracy. Ours is simpler and free to
train, and it is judged by the same ECE measure.

- **Training data**: `otp_wp_samples`, one snapshot per match at a minute picked by
  hashing the match ID (uniform over the game, never the last frame), from blue
  side's view. One per match avoids near-duplicate samples from consecutive frames,
  as the thesis and Maymin do. Capped at `OTP_WP_SAMPLE_CAP` (150k) newest rows.
- **Training**: `collector/src/train.ts`, run at the end of a collector run at most
  every `OTP_WP_RETRAIN_HOURS` (24). It needs `OTP_WP_MIN_SAMPLES` (5k) samples.
  Newton's method with L2 = 1 takes about 5 iterations and well under a second.
- **Evaluation**: 1 in 10 matches (by hashed match ID) is held out. Accuracy, ECE
  (20 equal-width bins) and log loss are logged and stored with the model. The final
  model is then refit on every sample.
- **Storage**: `otp_wp_model` keeps the newest 30 models. Views always use the newest one.

### Where the numbers are computed

- `otp_games.state_core` / `state_15` store raw states, not probabilities, so a
  retrained model applies to every raw game at once. An empty array means the
  timeline was unavailable.
- The views `otp_build_stats`, `otp_matchup_build_stats` and `otp_matchup_stats`
  evaluate the newest model per raw game and return sums (`wp_games`, `wp_wins`,
  `wp_sum`, `wp15_games`, `wp15_sum`). The site adds them across regions and computes
  the ratios (`app/otp/lib/data.ts`: `wpa`, `wpAtPurchase`, `laneWpa`, `adjustedLaneWpa`).
- When games pass the 14-day raw window, `otp_rollup_games` folds them into the
  per-patch rollups using the model current at that moment. Rolled-up WPA sums are
  never recomputed.

## Backfill

Games collected before WPA existed have no states. The collector's last regional
step (`backfillStates` in `collector/src/index.ts`) refetches their match and
timeline, newest first, and also adds their training samples. It runs only after
coverage, refresh and depth have finished for that run, so it uses spare rate limit
once collection has caught up. Only games still in the 14-day raw window can be
backfilled. Older games are already rolled up and their per-game data is gone.

## Caveats

- **Sample size.** Per-champion, per-build counts are small. Each game's ΔW varies
  a little less than a win/loss (variance `w(1−w)` instead of 0.25), but most WPA
  values are still noisy. Trust the `*` marker.
- **The model isn't perfect.** It sees team totals, not positions, items or champion
  matchups. Anything it misses (draft strength, a scaling champion) shows up in the
  WPA of whatever correlates with it.
- **Only the first core item's moment.** Build WPA measures the 3-item path from the
  moment the first core item is bought. The second and third purchases are also
  chosen in context, which this doesn't adjust for.
- **The game is not mirrored for training.** Samples are taken from blue side, and
  with no intercept the model ignores small side-dependent effects.

## Possible next steps

- Per-item WPA (each core slot from its own purchase moment), like the thesis's
  first-legendary analysis, ranked within similar states (ahead, even or behind at purchase).
- A reliability diagram on the page, built from the held-out predictions.
- Add Atakhan and feats once their timeline event names are confirmed.
