/**
 * An Item sheet for Animon Story items
 */

export default class AnimonItemSheet extends ItemSheet {

    static get defaultOptions() {
        // UPDATED: Use foundry.utils.mergeObject
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["animon", "sheet", "item"]
        })
    }

    get template() {
        return 'systems/animon/templates/sheets/' + this.item.type + '-sheet.hbs'
    }

    async getData() {
        const data = super.getData();
        data.config = CONFIG.animon;

        if (this.item.type == "relationship") {
            data.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description, { async: true });
        }

        return data;
    }
}