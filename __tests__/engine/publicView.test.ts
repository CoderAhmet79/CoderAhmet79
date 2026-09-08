import { chooseContract, createGame, dealHand, legalPlays, playCard } from '../../src/engine/game';
import { publicView } from '../../src/engine/publicView';
import { defaultRuleSet } from '../../src/engine/types';

describe('publicView', () => {
  it('only exposes the requesting player’s own hand', () => {
    let state = createGame(defaultRuleSet, 3);
    state = dealHand(state);
    const view = publicView(state, 0);
    expect(view.hand!.myHand).toEqual(state.hand!.hands[0]);
    expect(view.hand).not.toHaveProperty('hands');
    expect(JSON.stringify(view)).not.toContain(JSON.stringify(state.hand!.hands[1][0]));
  });

  it('tracks a player as void in a suit once they fail to follow it', () => {
    let state = createGame(defaultRuleSet, 3);
    state = dealHand(state);
    state = chooseContract(state, 'NO_TRICKS');
    const declarer = state.hand!.declarer;
    const leadCard = state.hand!.hands[declarer][0];
    state = playCard(state, declarer, leadCard);

    const nextPlayerId = state.hand!.turn;
    const legal = legalPlays(state, nextPlayerId);
    const offSuitCard = legal.find((c) => c.suit !== leadCard.suit);
    if (offSuitCard) {
      state = playCard(state, nextPlayerId, offSuitCard);
      const view = publicView(state, 0);
      expect(view.hand!.voidSuits[nextPlayerId]).toContain(leadCard.suit);
    }
  });

  it('reports correct remaining hand sizes without leaking card identities', () => {
    let state = createGame(defaultRuleSet, 3);
    state = dealHand(state);
    const view = publicView(state, 0);
    expect(view.hand!.handSizes).toEqual([13, 13, 13, 13]);
  });
});
