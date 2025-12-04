export default class AnimonCombatant extends Combatant {
    _getInitiativeFormula() {
        let actor = this.actor;
        let rollFormula = "";
        let dice = actor.system.initiative
        let item = null;
        let itemId = "";

        for (let i = 0; i < actor.items._source.length; i++) {
            if (actor.items._source[i].type == "quality" && actor.items._source[i].system.selected) {
                dice = dice + parseInt(actor.items._source[i].system.rank);

                itemId = actor.items._source[i]._id;
                item = actor.items.get(itemId);
                item.update({ "system.selected": false });
            };
        }
        rollFormula = dice + "d6cs>=" + "4";

        return rollFormula;
    }
}
