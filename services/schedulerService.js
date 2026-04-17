/**
 * Background monitoring scheduler
 */
const startScheduler = () => {
    setInterval(() => {
        console.log(`[Scheduler] Auto-checking active shift disruptions... (Time: ${new Date().toISOString()})`);
        // Example: logic to evaluate active shifts internally without blocking the main event loop
    }, 60000); // Check every minute
    console.log('[Scheduler] Background monitoring active.');
};

module.exports = { startScheduler };
