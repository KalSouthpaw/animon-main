import { animon } from "./module/config.js";
import AnimonItemSheet from "./module/sheets/AnimonItemSheet.js";
import AnimonCharacterSheet from "./module/sheets/AnimonCharacterSheet.js";
import AnimonCombatant from "./module/combat/combatant.js";

//register all handlebars templates
async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/animon/templates/partials/signature-attack-display.hbs",
        "systems/animon/templates/partials/quality-display.hbs",
        "systems/animon/templates/partials/relationship-display.hbs"
    ];

    return loadTemplates(templatePaths)
};

Hooks.once("init", function () {
    console.log("Animon | Initialising Animon");

    CONFIG.animon = animon;
    CONFIG.Combatant.documentClass = AnimonCombatant;

    //unregister core item sheets and use AnimonItemSheet
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("animon", AnimonItemSheet, { makeDefault: true });

    //unregister core actor sheet and use AnimonCharacterSheet
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("animon", AnimonCharacterSheet, { makeDefault: true });

    preloadHandlebarsTemplates();
});

Handlebars.registerHelper("multiple", function (n, content) {
    let result = "";
    for (let i = 0; i < n; i++) {
        content.data.index = i + 1;
        result += content.fn(i)
    }
    return result;
});