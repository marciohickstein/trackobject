// Read parameters to set on enviroment variables
require('dotenv').config();

// Load modules
const crypto = require('crypto');
const cron = require('node-cron');
const { rastro } = require('rastrojs');
const { writeFileSync } = require('fs');
const sendMail = require('./utils/sendmail');

sendMail.setConfig({
    host: process.env.MAIL_HOST,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM
});

// Read file data with all objects to track
let objects = require('./data/objects2track.json');

// Clean hash content codes
for (const object of objects) {
    delete object.hash;
}

function removeTrackObject(code){
    const newObjects = objects.filter((object) => object.code != code);
    objects = newObjects;
    writeFileSync('./data/codeObjects.json', new String(JSON.stringify(objects)));
}

function getTrackingText(tracks){
    let text = "";

    for (const track of tracks) {
        text +=`${track.locale} ${track.status} ${track.observation} ${track.trackedAt}\n`;
    }

    return text;
}

async function trackObject(object){
    console.log(`Tracking object: ${object.code}`);
    const track = await rastro.track(object.code);

    if (track[0].isDelivered){
        const subject = `Entrega concluída do objeto: ${object.code}`
        let text = `A sua encomenda já chegou!\n\n`;
        text += getTrackingText(track[0].tracks) + "\n";
        text += `Por favor, não responda esta mensagem!`;
        sendMail.send(subject, text, object.email);
        removeTrackObject(object.code);
    }
    
    const hash = crypto.createHash('md5').update(JSON.stringify(track[0].tracks)).digest('hex');
    
    if (object.hash && object.hash !== hash){
        const subject = `Status do objeto: ${object.code} foi atualizado`
        let text = `Seu encomenda sofreu uma atualização!\n\n`;
        text += getTrackingText(track[0].tracks) + "\n";
        text += `Por favor, não responda esta mensagem!`;
        sendMail.send(subject, text, object.email);
        removeTrackObject(object.code);
    }

    object.hash = hash;
}

async function trackAllObjects(objects){
    console.log(`==== ${new Date()} ===`)
    for (const object of objects) {
        await trackObject(object);
    }
}

trackAllObjects(objects);
scheduleString = process.env.SCHEDULE || '* * * * *';
cron.schedule(scheduleString, () => {
    trackAllObjects(objects);
})

