import type { Game, Outcome, MarketType } from '../types';
import type { SlipLeg } from './BetSlip';
import { formatOdds, formatPoint, formatGameTime } from '../lib/odds';

interface GameCardProps {
  game: Game;
  selectedLegs: SlipLeg[];
  onToggleLeg: (game: Game, market: MarketType, outcome: Outcome, bookmaker: string) => void;
}

export default function GameCard({ game, selectedLegs, onToggleLeg }: GameCardProps) {
  const isLive = !game.completed && new Date(game.commenceTime) <= new Date();
  const isCompleted = game.completed;

  const primaryBookmaker = game.bookmakers[0];
  const h2h = primaryBookmaker?.markets.find((m) => m.key === 'h2h');
  const spreads = primaryBookmaker?.markets.find((m) => m.key === 'spreads');
  const totals = primaryBookmaker?.markets.find((m) => m.key === 'totals');

  const homeH2H = h2h?.outcomes.find((o) => o.name === game.homeTeam);
  const awayH2H = h2h?.outcomes.find((o) => o.name === game.awayTeam);
  const homeSpread = spreads?.outcomes.find((o) => o.name === game.homeTeam);
  const awaySpread = spreads?.outcomes.find((o) => o.name === game.awayTeam);
  const over = totals?.outcomes.find((o) => o.name === 'Over');
  const under = totals?.outcomes.find((o) => o.name === 'Under');

  const bookmakerKey = primaryBookmaker?.key ?? '';

  function isSelected(market: MarketType, outcomeName: string): boolean {
    return selectedLegs.some(
      (l) => l.game._id === game._id && l.market === market && l.outcome.name === outcomeName,
    );
  }

  function handleClick(market: MarketType, outcome: Outcome | undefined) {
    if (!outcome || isCompleted) return;
    onToggleLeg(game, market, outcome, bookmakerKey);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 text-xs text-gray-400">
        <span>{formatGameTime(game.commenceTime)}</span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-semibold uppercase tracking-wider">
              Live
            </span>
          )}
          {isCompleted && (
            <span className="px-1.5 py-0.5 bg-gray-600/30 text-gray-500 rounded text-[10px] font-semibold uppercase tracking-wider">
              Final
            </span>
          )}
          {primaryBookmaker && (
            <span className="text-gray-500">{primaryBookmaker.title}</span>
          )}
        </div>
      </div>

      {/* Odds Grid */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-px bg-gray-800">
        {/* Column Headers */}
        <div className="bg-gray-900 px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          Teams
        </div>
        <div className="bg-gray-900 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold text-center min-w-[72px]">
          ML
        </div>
        <div className="bg-gray-900 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold text-center min-w-[90px]">
          Spread
        </div>
        <div className="bg-gray-900 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold text-center min-w-[90px]">
          Total
        </div>

        {/* Away Team Row */}
        <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-3">
          <span className="font-medium text-sm text-gray-200">{game.awayTeam}</span>
          {game.scores && (
            <span className={`text-sm font-bold ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
              {game.scores.away}
            </span>
          )}
        </div>
        <OddsCell outcome={awayH2H} disabled={isCompleted} selected={isSelected('h2h', game.awayTeam)} onClick={() => handleClick('h2h', awayH2H)} />
        <OddsCell
          outcome={awaySpread}
          showPoint
          disabled={isCompleted}
          selected={isSelected('spreads', game.awayTeam)}
          onClick={() => handleClick('spreads', awaySpread)}
        />
        <OddsCell
          outcome={over}
          showPoint
          prefix="O"
          disabled={isCompleted}
          selected={isSelected('totals', 'Over')}
          onClick={() => handleClick('totals', over)}
        />

        {/* Home Team Row */}
        <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-3">
          <span className="font-medium text-sm text-gray-200">{game.homeTeam}</span>
          {game.scores && (
            <span className={`text-sm font-bold ${isCompleted ? 'text-gray-400' : 'text-white'}`}>
              {game.scores.home}
            </span>
          )}
        </div>
        <OddsCell outcome={homeH2H} disabled={isCompleted} selected={isSelected('h2h', game.homeTeam)} onClick={() => handleClick('h2h', homeH2H)} />
        <OddsCell
          outcome={homeSpread}
          showPoint
          disabled={isCompleted}
          selected={isSelected('spreads', game.homeTeam)}
          onClick={() => handleClick('spreads', homeSpread)}
        />
        <OddsCell
          outcome={under}
          showPoint
          prefix="U"
          disabled={isCompleted}
          selected={isSelected('totals', 'Under')}
          onClick={() => handleClick('totals', under)}
        />
      </div>
    </div>
  );
}

function OddsCell({
  outcome,
  showPoint,
  prefix,
  disabled,
  selected,
  onClick,
}: {
  outcome?: Outcome;
  showPoint?: boolean;
  prefix?: string;
  disabled?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  if (!outcome) {
    return <div className="bg-gray-900 px-3 py-2.5 text-center text-gray-600 text-sm">-</div>;
  }

  const baseClasses = 'px-3 py-2.5 text-center text-sm transition-colors';
  const stateClasses = disabled
    ? 'bg-gray-900 text-gray-600 cursor-default'
    : selected
      ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 cursor-pointer hover:bg-orange-500/30'
      : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-orange-400 cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses}`}
    >
      {showPoint && outcome.point !== undefined && (
        <span className="text-gray-500 mr-1 text-xs">
          {prefix ?? ''}{formatPoint(outcome.point)}
        </span>
      )}
      <span className={`font-mono font-medium ${
        selected
          ? 'text-orange-300'
          : outcome.price > 0
            ? 'text-green-400'
            : disabled
              ? 'text-gray-600'
              : 'text-gray-300'
      }`}>
        {formatOdds(outcome.price)}
      </span>
    </button>
  );
}
