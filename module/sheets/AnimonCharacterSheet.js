import * as dice from "../dice.js";

/**
 * An Actor sheet for Animon characters
 */

export default class AnimonCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        // UPDATED: Use foundry.utils.mergeObject
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["animon", "sheet", "actor"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "info" }]
        })
    }

    itemContextMenu = [
        {
            name: game.i18n.localize("SCRPG.button.edit"),
            icon: '<i class="fas fa-edit"></i>',
            callback: element => {
                const item = this.actor.items.get(element.data("item-id"));
                item.sheet.render(true);
            }
        },
        {
            name: game.i18n.localize("SCRPG.button.delete"),
            icon: '<i class="fas fa-trash"></i>',
            callback: element => {
                this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")])
            }
        }
    ]

    get template() {
        return "systems/animon/templates/sheets/" + this.actor.type + "-sheet.hbs";
    }

    async getData() {
        const data = super.getData();
        data.config = CONFIG.animon;

        if (this.actor.type == "child") {
            data.enrichedTypeFeature = await TextEditor.enrichHTML(this.object.system.typeFeature, { async: true });
            data.enrichedStuff = await TextEditor.enrichHTML(this.object.system.stuff, { async: true });
        }

        if (this.actor.type == 'animon') {
            this._prepareAnimonItems(data);
        }

        if (this.actor.type == 'child') {
            this._prepareChildItems(data);
        }

        return data;
    }

    //Prepares all items associated with the animon sheets
    _prepareAnimonItems(sheetData) {
        const actorData = sheetData.actor;
        const qualities = [];
        const signatureattacks = [];

        // V13 Safe Iteration over items
        for (let i of sheetData.items) {
            i.img = i.img;
            if (i.type === "quality") {
                qualities.push(i);
            }
            if (i.type === "signatureAttack") {
                signatureattacks.push(i);
            }
        }

        actorData.quality = qualities;
        actorData.signatureAttack = signatureattacks;
    }

    _prepareChildItems(sheetData) {
        const actorData = sheetData.actor;
        const talents = [];
        const relationships = [];

        for (let i of sheetData.items) {
            i.img = i.img;
            if (i.type === "talent") {
                talents.push(i);
            }
            if (i.type === "relationship") {
                relationships.push(i);
            }
        }

        actorData.talent = talents;
        actorData.relationship = relationships;
    }

    activateListeners(html) {

        if (this.actor.isOwner) {

            //Roll stat
            html.find(".roll-stat").click(this._onRollStat.bind(this));
            //item creation
            html.find(".item-create").click(this._onItemCreate.bind(this));
            //item deletion
            html.find(".item-delete").click(this._onItemDelete.bind(this));
            //item edit
            html.find(".item-edit").click(this._onItemEdit.bind(this));
            //edit items on character sheet
            html.find(".inline-edit").change(this._onItemEditInline.bind(this))
            //selects or unselects qualities
            html.find(".add-talent").click(this._onAddTalent.bind(this))
            //selects or unselects qualities
            html.find(".add-quality").click(this._onAddQuality.bind(this))
            //selects or unselects signature attack
            html.find(".add-signature-attack").click(this._onAddSignatureAttack.bind(this))
            //Update HP total on heart change
            html.find(".update-hit-points").change(this._onUpdateHitPoints.bind(this))
            //Update damage on power change
            html.find(".update-damage").change(this._onUpdateDamage.bind(this))
            //Update dodge on agility change
            html.find(".update-dodge").change(this._onUpdateDodge.bind(this))
            //Update initiative on brains change
            html.find(".update-initiative").change(this._onUpdateInitiative.bind(this))
            //Deselect of signature attacks when sigUses changes to 0
            html.find(".update-sig-uses").change(this._onUpdateSigUses.bind(this))
            //Update stage change
            html.find(".stage-change").change(this._onStageChange.bind(this))
            //Update HP total on Max HP advancement
            html.find(".advance-hit-points").focusout(this._onAdvanceHitPoints.bind(this))
            //Update dodge on dodge advancement
            html.find(".advance-dodge").focusout(this._onAdvanceDodge.bind(this))
            //Update initiative on initiative advancement
            html.find(".advance-intitiative").focusout(this._onAdvanceInitiative.bind(this))
            //Update damage on damage advancement
            html.find(".advance-damage").focusout(this._onAdvanceDamage.bind(this))
            //Updates XP track when an XP point is selected
            html.find(".set-xp").click(this._onSetXP.bind(this))
            //Update HP and Bond Points on agility change
            html.find(".update-bond-level").change(this._onUpdateBondLevel.bind(this))
        }

        super.activateListeners(html);
    }

    _onRollStat(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let stat = element.dataset.stat;
        let die = element.dataset.value;

        dice.StatCheck(stat, die, this.actor);
    }

    //checks item type and creates new item of that type
    _onItemCreate(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemData = null;
        var stage = "2";

        switch (element.dataset.type) {
            case "quality":
                if (element.dataset.stage) {
                    stage = element.dataset.stage;
                }
                itemData = {
                    name: game.i18n.localize("animon.sheet.newItem"),
                    type: element.dataset.type,
                    "system.stage": stage
                }
                break;
            case "signatureAttack":
                if (element.dataset.stage) {
                    stage = element.dataset.stage;
                }
                itemData = {
                    name: game.i18n.localize("animon.sheet.newItem"),
                    type: element.dataset.type,
                    "system.stage": stage,
                    "system.rank": stage - 1
                }
                break;
            default:
                itemData = {
                    name: game.i18n.localize("animon.sheet.newItem"),
                    type: element.dataset.type
                };
        }

        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    //deletes the closest item
    _onItemDelete(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;

        let d = Dialog.confirm({
            title: "Delete",
            content: "<p>Are you sure you want to delete this item?</p>",
            yes: () => this.actor.deleteEmbeddedDocuments("Item", [itemId]),
            no: () => console.log("Foundry VTT | Item with id [" + itemId + "] was not deleted"),
            defaultYes: false
        });

        return d
    }

    //Opens item sheet so it can be edited
    _onItemEdit(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;
        let item = this.actor.items.get(itemId);

        item.sheet.render(true)
    }

    //edit items on character sheet
    _onItemEditInline(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        return item.update({ [field]: element.value })
    }

    _onAddTalent(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;
        let item = this.actor.items.get(itemId);
        if (item.system.selected) {
            item.update({ "system.selected": false })
        } else {
            item.update({ "system.selected": true })
        }
    }

    _onAddQuality(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;
        let item = this.actor.items.get(itemId);
        if (item.system.selected) {
            item.update({ "system.selected": false })
        } else {
            item.update({ "system.selected": true })
        }
    }

    _onAddSignatureAttack(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemType = "." + element.dataset.type + "-item"
        let itemId = element.closest(itemType).dataset.itemId;
        let signatureAttackId = ""
        let item = this.actor.items.get(itemId);
        if (this.actor.system.sigUses.value > 0) {
            if (item.system.selected) {
                item.update({ "system.selected": false })
            } else {
                for (let i = 0; i < this.actor.signatureAttack.length; i++) {
                    signatureAttackId = this.actor.signatureAttack[i]._id;
                    item = this.actor.items.get(signatureAttackId);
                    if (signatureAttackId == itemId) {
                        item.update({ "system.selected": true })
                    } else {
                        item.update({ "system.selected": false })
                    }
                }
            }
        }
    }

    _onUpdateDamage(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let power = parseFloat(element.value);
        let damage = 0;
        let advancement = 0;

        if (this.actor.system.advancement.damage1) { advancement = advancement + 2 }
        if (this.actor.system.advancement.damage2) { advancement = advancement + 2 }

        switch (element.dataset.stage) {
            case "1":
                damage = power + advancement;
                this.actor.update({ "system.fledgling.damage": damage });
                break;
            case "2":
                damage = 2 * power + advancement;
                this.actor.update({ "system.basic.damage": damage });
                break;
            case "3":
                damage = 3 * power + advancement;
                this.actor.update({ "system.super.damage": damage });
                break;
            case "4":
                damage = 4 * power + advancement;
                this.actor.update({ "system.ultra.damage": damage });
                break;
            case "5":
                damage = 5 * power + advancement;
                this.actor.update({ "system.giga.damage": damage });
                break;
        }
    }

    _onAdvanceDamage(event) {
        event.preventDefault();
        let damage = 0;
        let advancement = 0;

        if (this.actor.system.advancement.damage1) { advancement = advancement + 2 }
        if (this.actor.system.advancement.damage2) { advancement = advancement + 2 }

        damage = this.actor.system.fledgling.stats.power + advancement;
        this.actor.update({ "system.fledgling.damage": damage });

        damage = this.actor.system.basic.stats.power * 2 + advancement;
        this.actor.update({ "system.basic.damage": damage });

        damage = this.actor.system.super.stats.power * 3 + advancement;
        this.actor.update({ "system.super.damage": damage });

        damage = this.actor.system.ultra.stats.power * 4 + advancement;
        this.actor.update({ "system.ultra.damage": damage });

        damage = this.actor.system.giga.stats.power * 5 + advancement;
        this.actor.update({ "system.giga.damage": damage });
    }

    _onUpdateHitPoints(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let heart = parseFloat(element.value);
        let hitPoints = 0;
        let advancement = 0;

        if (this.actor.system.advancement.maxHP1) { advancement = advancement + 5 }
        if (this.actor.system.advancement.maxHP2) { advancement = advancement + 5 }

        switch (element.dataset.stage) {
            case "1":
                hitPoints = 3 * heart + advancement;
                this.actor.update({ "system.fledgling.wounds.max": hitPoints });
                break;
            case "2":
                hitPoints = 5 + 3 * heart + advancement;
                this.actor.update({ "system.basic.wounds.max": hitPoints });
                break;
            case "3":
                hitPoints = 10 + 4 * heart + advancement;
                this.actor.update({ "system.super.wounds.max": hitPoints });
                break;
            case "4":
                hitPoints = 15 + 5 * heart + advancement;
                this.actor.update({ "system.ultra.wounds.max": hitPoints });
                break;
            case "5":
                hitPoints = 20 + 6 * heart + advancement;
                this.actor.update({ "system.giga.wounds.max": hitPoints });
                break;
        }
    }

    _onAdvanceHitPoints(event) {
        event.preventDefault();
        let hitPoints = 0;
        let advancement = 0;
        let difference = this.actor.system.wounds.max - this.actor.system.wounds.value;
        let currentHitPoints = 0;

        if (this.actor.system.advancement.maxHP1) { advancement = advancement + 5 }
        if (this.actor.system.advancement.maxHP2) { advancement = advancement + 5 }

        hitPoints = 3 * this.actor.system.fledgling.stats.heart + advancement;
        this.actor.update({ "system.fledgling.wounds.max": hitPoints });
        if (this.actor.system.stage == "1") {
            currentHitPoints = hitPoints
        }

        hitPoints = 5 + 3 * this.actor.system.basic.stats.heart + advancement;
        this.actor.update({ "system.basic.wounds.max": hitPoints });
        if (this.actor.system.stage == "2") {
            currentHitPoints = hitPoints
        }

        hitPoints = 10 + 4 * this.actor.system.super.stats.heart + advancement;
        this.actor.update({ "system.super.wounds.max": hitPoints });
        if (this.actor.system.stage == "3") {
            currentHitPoints = hitPoints
        }

        hitPoints = 15 + 5 * this.actor.system.ultra.stats.heart + advancement;
        this.actor.update({ "system.ultra.wounds.max": hitPoints });
        if (this.actor.system.stage == "4") {
            currentHitPoints = hitPoints
        }

        hitPoints = 20 + 6 * this.actor.system.giga.stats.heart + advancement;
        this.actor.update({ "system.giga.wounds.max": hitPoints });
        if (this.actor.system.stage == "5") {
            currentHitPoints = hitPoints
        }

        this.actor.update({ "system.wounds.max": currentHitPoints });
        this.actor.update({ "system.wounds.value": currentHitPoints - difference });
    }

    _onUpdateDodge(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let dodge = parseFloat(element.value);

        if (this.actor.system.advancement.dodge1) { dodge = dodge + 1 }
        if (this.actor.system.advancement.dodge2) { dodge = dodge + 1 }

        switch (element.dataset.stage) {
            case "1":
                this.actor.update({ "system.fledgling.dodge": dodge });
                break;
            case "2":
                this.actor.update({ "system.basic.dodge": dodge });
                break;
            case "3":
                this.actor.update({ "system.super.dodge": dodge });
                break;
            case "4":
                this.actor.update({ "system.ultra.dodge": dodge });
                break;
            case "5":
                this.actor.update({ "system.giga.dodge": dodge });
                break;
        }
    }

    _onAdvanceDodge(event) {
        event.preventDefault();
        let dodge = 0;
        let advancement = 0;

        if (this.actor.system.advancement.dodge1) { advancement = advancement + 1 }
        if (this.actor.system.advancement.dodge2) { advancement = advancement + 1 }

        dodge = this.actor.system.fledgling.stats.agility + advancement;
        this.actor.update({ "system.fledgling.dodge": dodge });

        dodge = this.actor.system.basic.stats.agility + advancement;
        this.actor.update({ "system.basic.dodge": dodge });

        dodge = this.actor.system.super.stats.agility + advancement;
        this.actor.update({ "system.super.dodge": dodge });

        dodge = this.actor.system.ultra.stats.agility + advancement;
        this.actor.update({ "system.ultra.dodge": dodge });

        dodge = this.actor.system.giga.stats.agility + advancement;
        this.actor.update({ "system.giga.dodge": dodge });
    }

    _onUpdateInitiative(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let initiative = parseFloat(element.value);

        if (this.actor.system.advancement.initiative1) { initiative = initiative + 1 }
        if (this.actor.system.advancement.initiative2) { initiative = initiative + 1 }

        switch (element.dataset.stage) {
            case "1":
                this.actor.update({ "system.fledgling.initiative": initiative });
                this.actor.update({ "system.fledgling.sigUses.max": initiative });
                if (this.actor.system.stage == "1") {
                    this.actor.update({ "system.initiative": initiative });
                }
                break;
            case "2":
                this.actor.update({ "system.basic.initiative": initiative });
                this.actor.update({ "system.basic.sigUses.max": initiative });
                if (this.actor.system.stage == "2") {
                    this.actor.update({ "system.initiative": initiative });
                }
                break;
            case "3":
                this.actor.update({ "system.super.initiative": initiative });
                this.actor.update({ "system.super.sigUses.max": initiative });
                if (this.actor.system.stage == "3") {
                    this.actor.update({ "system.initiative": initiative });
                }
                break;
            case "4":
                this.actor.update({ "system.ultra.initiative": initiative });
                this.actor.update({ "system.ultra.sigUses.max": initiative });
                if (this.actor.system.stage == "4") {
                    this.actor.update({ "system.initiative": initiative });
                }
                break;
            case "5":
                this.actor.update({ "system.giga.initiative": initiative });
                this.actor.update({ "system.giga.sigUses.max": initiative });
                if (this.actor.system.stage == "5") {
                    this.actor.update({ "system.initiative": initiative });
                }
                break;
        }
    }

    _onUpdateSigUses(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let sigUses = parseFloat(element.value);
        let itemId = "";
        let item = null;

        if (sigUses < 1) {
            for (let i = 0; i < this.actor.signatureAttack.length; i++) {
                if (this.actor.signatureAttack[i].system.selected) {
                    itemId = this.actor.signatureAttack[i]._id
                    item = this.actor.items.get(itemId);
                    item.update({ "system.selected": false });
                };
            }
        }
    }

    _onAdvanceInitiative(event) {
        event.preventDefault();
        let initiative = 0;
        let advancement = 0;

        if (this.actor.system.advancement.initiative1) { advancement = advancement + 1 }
        if (this.actor.system.advancement.initiative2) { advancement = advancement + 1 }

        initiative = this.actor.system.fledgling.stats.brains + advancement;
        this.actor.update({ "system.fledgling.initiative": initiative });
        this.actor.update({ "system.fledgling.sigUses.max": initiative });

        initiative = this.actor.system.basic.stats.brains + advancement;
        this.actor.update({ "system.basic.initiative": initiative });
        this.actor.update({ "system.basic.sigUses.max": initiative });

        initiative = this.actor.system.super.stats.brains + advancement;
        this.actor.update({ "system.super.initiative": initiative });
        this.actor.update({ "system.super.sigUses.max": initiative });

        initiative = this.actor.system.ultra.stats.brains + advancement;
        this.actor.update({ "system.ultra.initiative": initiative });
        this.actor.update({ "system.ultra.sigUses.max": initiative });

        initiative = this.actor.system.giga.stats.brains + advancement;
        this.actor.update({ "system.giga.initiative": initiative });
        this.actor.update({ "system.giga.sigUses.max": initiative });
    }

    _onStageChange(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let stage = element.value;
        let currentDamage = this.actor.system.wounds.max - this.actor.system.wounds.value;
        let currentHitPoints = 0;
        let currentSigUses = this.actor.system.sigUses.max - this.actor.system.sigUses.value;
        let newSigUses = 0;
        let item = null;
        let itemId = "";

        for (let i = 0; i < this.actor.quality.length; i++) {
            if (this.actor.quality[i].system.selected) {
                itemId = this.actor.quality[i]._id
                item = this.actor.items.get(itemId);
                item.update({ "system.selected": false });
            };
        }

        if (this.actor.type == "animon") {
            for (let i = 0; i < this.actor.signatureAttack.length; i++) {
                if (this.actor.signatureAttack[i].system.selected) {
                    itemId = this.actor.signatureAttack[i]._id
                    item = this.actor.items.get(itemId);
                    item.update({ "system.selected": false });
                };
            }
        }

        switch (stage) {
            case "1":
                currentHitPoints = this.actor.system.fledgling.wounds.max - currentDamage;
                if (currentHitPoints <= 1) { currentHitPoints = 1 }
                this.actor.update({ "system.wounds.max": this.actor.system.fledgling.wounds.max });
                this.actor.update({ "system.wounds.value": currentHitPoints });
                newSigUses = 0;
                if (newSigUses <= 0) { newSigUses = 0 }
                this.actor.update({ "system.sigUses.max": 0 });
                this.actor.update({ "system.sigUses.value": newSigUses });
                this.actor.update({ "system.initiative": this.actor.system.fledgling.initiative });
                this.actor.update({ "name": this.actor.system.fledgling.name });
                break;
            case "2":
                currentHitPoints = this.actor.system.basic.wounds.max - currentDamage;
                if (currentHitPoints <= 1) { currentHitPoints = 1 }
                this.actor.update({ "system.wounds.max": this.actor.system.basic.wounds.max });
                this.actor.update({ "system.wounds.value": currentHitPoints });
                newSigUses = this.actor.system.basic.sigUses.max - currentSigUses;
                if (newSigUses <= 0) { newSigUses = 0 }
                this.actor.update({ "system.sigUses.max": this.actor.system.basic.sigUses.max });
                this.actor.update({ "system.sigUses.value": newSigUses });
                this.actor.update({ "system.initiative": this.actor.system.basic.initiative });
                this.actor.update({ "name": this.actor.system.basic.name });
                break;
            case "3":
                currentHitPoints = this.actor.system.super.wounds.max - currentDamage;
                if (currentHitPoints <= 1) { currentHitPoints = 1 }
                this.actor.update({ "system.wounds.max": this.actor.system.super.wounds.max });
                this.actor.update({ "system.wounds.value": currentHitPoints });
                newSigUses = this.actor.system.super.sigUses.max - currentSigUses;
                if (newSigUses <= 0) { newSigUses = 0 }
                this.actor.update({ "system.sigUses.max": this.actor.system.super.sigUses.max });
                this.actor.update({ "system.sigUses.value": newSigUses });
                this.actor.update({ "system.initiative": this.actor.system.super.initiative });
                this.actor.update({ "name": this.actor.system.super.name });
                break;
            case "4":
                currentHitPoints = this.actor.system.ultra.wounds.max - currentDamage;
                if (currentHitPoints <= 1) { currentHitPoints = 1 }
                this.actor.update({ "system.wounds.max": this.actor.system.ultra.wounds.max });
                this.actor.update({ "system.wounds.value": currentHitPoints });
                newSigUses = this.actor.system.ultra.sigUses.max - currentSigUses;
                if (newSigUses <= 0) { newSigUses = 0 }
                this.actor.update({ "system.sigUses.max": this.actor.system.ultra.sigUses.max });
                this.actor.update({ "system.sigUses.value": newSigUses });
                this.actor.update({ "system.initiative": this.actor.system.ultra.initiative });
                this.actor.update({ "name": this.actor.system.ultra.name });
                break;
            case "5":
                currentHitPoints = this.actor.system.giga.wounds.max - currentDamage;
                if (currentHitPoints <= 1) { currentHitPoints = 1 }
                this.actor.update({ "system.wounds.max": this.actor.system.giga.wounds.max });
                this.actor.update({ "system.wounds.value": currentHitPoints });
                newSigUses = this.actor.system.giga.sigUses.max - currentSigUses;
                if (newSigUses <= 0) { newSigUses = 0 }
                this.actor.update({ "system.sigUses.max": this.actor.system.giga.sigUses.max });
                this.actor.update({ "system.sigUses.value": newSigUses });
                this.actor.update({ "system.initiative": this.actor.system.giga.initiative });
                this.actor.update({ "name": this.actor.system.giga.name });
                break;
        }
    }

    _onSetXP(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let current = parseInt(element.dataset.num);
        if (this.actor.system.xp == current) {
            this.actor.update({ "system.xp": 0 })
        } else {
            this.actor.update({ "system.xp": current })
        }
    }

    _onUpdateBondLevel(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let bondLevel = parseFloat(element.value);
        let hitPoints = bondLevel + 9;
        let bondPoints = bondLevel + 5;
        let newHitPoints = 0;
        let newBondPoints = 0;

        newHitPoints = this.actor.system.wounds.value + hitPoints - this.actor.system.wounds.max;
        newBondPoints = this.actor.system.bondPoints.value + bondPoints - this.actor.system.bondPoints.max;

        this.actor.update({ "system.wounds.max": hitPoints });
        this.actor.update({ "system.bondPoints.max": bondPoints });
        this.actor.update({ "system.wounds.value": newHitPoints });
        this.actor.update({ "system.bondPoints.value": newBondPoints });
    }

    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        if (!this.isValidDropItem(this.actor.type, itemData.type)) {
            return false;
        }

        // Handle item sorting within the same Actor
        if (this.actor.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);

        // Create the owned item
        return this._onDropItemCreate(itemData);

    }

    /** * Helper Function for _onDropItem.
     * Return true if the dropped itemDataType is a drag and droppable item and is valid for the actorType, else return false
     **/
    isValidDropItem(actorType, itemDataType) {

        const dragAndDropableItems = ["talent", "relationship", "quality", "signatureAttack"];     //List of itemTypes that is checked, so item ordering isn't affected.
        const validChildDrops = ["talent", "relationship"];
        const validAnimonDrops = ["quality", "signatureAttack"];

        // This filter is only for Drag and Droppable from side bar, so allow any items that is not a drag and droppable item
        // Basically don't stop the item reorder or create owned item. 
        if (!dragAndDropableItems.includes(itemDataType)) {
            return true;
        }

        if (actorType == 'child' && !validChildDrops.includes(itemDataType)) {
            return false;
        }
        else if (actorType == 'animon' && !validAnimonDrops.includes(itemDataType)) {
            return false;
        };

        return true;
    }
}