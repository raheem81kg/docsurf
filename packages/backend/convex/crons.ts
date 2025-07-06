import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// crons.interval("clear dangling files", { hours: 1 }, internal.files.clearDangling);

// crons.cron("reset credits", "0 0 * * *", internal.users.resetCredits);

// Run every day at 2:00 AM UTC
crons.cron("delete old trashed documents and files", "0 2 * * *", internal.maintenance.deleteOldTrashedDocumentsAndFiles);

export default crons;
