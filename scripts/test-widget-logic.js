
const { toZonedTime } = require('date-fns-tz');

async function main() {
    const timezone = 'Asia/Makassar';
    const now = new Date();
    console.log('Now (UTC/Local):', now.toISOString());

    try {
        const zonedNow = toZonedTime(now, timezone);
        console.log('Zoned Now:', zonedNow.toISOString()); // This will likely be the "shifted" date

        const startOfDay = new Date(zonedNow);
        startOfDay.setHours(0, 0, 0, 0);
        console.log('Start of Day (Zoned):', startOfDay.toISOString());

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        console.log('End of Day (Zoned):', endOfDay.toISOString());

        console.log('Date-fns-tz test PASSED');
    } catch (e) {
        console.error('Date-fns-tz test FAILED:', e);
    }
}

main();
