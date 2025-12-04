export default class AnimonCombatant extends Combatant {
    /**
     * Override the default Initiative Roll to calculate based on Animon rules
     * @override
     */
    async getInitiativeRoll(formula) {
        let actor = this.actor;
        let rollFormula = "";
        let dice = actor.system.initiative
        let item = null;
        let itemId = "";

        // Iterate over items to find selected qualities
        // We use actor.items to ensure we get the Collection
        for (let i of actor.items) {
            if (i.type == "quality" && i.system.selected) {
                dice = dice + parseInt(i.system.rank);

                // Side effect: Unselect the quality after using it for initiative
                await i.update({ "system.selected": false });
            };
        }
        
        // Calculate formula: Xd6 counting successes >= 4
        rollFormula = dice + "d6cs>=" + "4";

        // Return the evaluated roll promise
        return new Roll(rollFormula).evaluate();
    }
}