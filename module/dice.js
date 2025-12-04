export async function StatCheck(stat, die, actor) {
    let rollFormula = "";
    let sigUses = 0;
    let checkOptions = await GetStatCheckOptions(stat)

    if (checkOptions.cancelled) {
        return;
    }

    let dice = parseInt(die) + parseInt(checkOptions.extra);
    let item = null;
    let itemId = "";

    if (actor.type == "child") {
        for (let i = 0; i < actor.talent.length; i++) {
            if (actor.talent[i].system.selected) {
                dice = dice + parseInt(actor.talent[i].system.rank);
                itemId = actor.talent[i]._id
                item = actor.items.get(itemId);
                await item.update({ "system.selected": false });
            };
        }
    }

    if (actor.type == "animon") {
        sigUses = actor.system.sigUses.value
        for (let i = 0; i < actor.quality.length; i++) {
            if (actor.quality[i].system.selected) {
                dice = dice + parseInt(actor.quality[i].system.rank);
                itemId = actor.quality[i]._id
                item = actor.items.get(itemId);
                await item.update({ "system.selected": false });
            };
        }
        for (let i = 0; i < actor.signatureAttack.length; i++) {
            if (actor.signatureAttack[i].system.selected) {
                sigUses = sigUses - 1;
                dice = dice + parseInt(actor.signatureAttack[i].system.rank);
                itemId = actor.signatureAttack[i]._id
                item = actor.items.get(itemId);
                await item.update({ "system.selected": false });
                await actor.update({ "system.sigUses.value": sigUses })
            };
        }
    }

    rollFormula = dice + "d6cs>=" + checkOptions.type

    let messageData = {
        speaker: ChatMessage.getSpeaker()
    }

    // UPDATED FOR V13: Rolls must be evaluated asynchronously
    let rollResult = await new Roll(rollFormula).evaluate();
    rollResult.toMessage(messageData)
}

async function GetStatCheckOptions(stat) {
    const template = "systems/animon/templates/chat/stat-check-dialog.hbs";
    const html = await renderTemplate(template, {});

    return new Promise(resolve => {
        const data = {
            title: game.i18n.format("animon.chat.title", { type: stat }),
            content: html,
            buttons: {
                normal: {
                    label: game.i18n.localize("animon.chat.roll"),
                    callback: html => resolve(_processStatCheckOptions(html[0].querySelector("form")))
                },
                cancel: {
                    label: game.i18n.localize("animon.chat.cancel"),
                    callback: html => resolve({ cancelled: true })
                }
            },
            default: "normal",
            close: () => resolve({ cancelled: true })
        };

        new Dialog(data, null).render(true);
    });
}

function _processStatCheckOptions(form) {
    return {
        type: form.type.value,
        extra: form.extra.value
    };
}