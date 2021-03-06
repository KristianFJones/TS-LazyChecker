// src/Modules/Schedule/Scheduler.ts
import { Job, Worker } from 'bullmq';
import Container from 'typedi';
import { logger, LogMode } from '../../Library/Logging';
import { configController } from '../Config/ConfigController';
import { RapidRecoveryController } from '../RapidRecovery/RapidRecoveryController';
import { CheckerQue } from './Que';
import parser from 'cron-parser';

/**
 * Start the TS-LazyChecker Job Scheduler
 * @returns Promise.all containing the process and added job of the scheduler
 */
export async function startScheduler(): Promise<Job> {
  const configPath = process.env.CONFIG_PATH || 'config.yml';

  logger.log(LogMode.INFO, 'Starting Scheduler');

  const appConfig = await configController.loadConfig(configPath);

  const rrController = Container.get(RapidRecoveryController);

  logger.log(LogMode.INFO, 'Loaded Config');

  const schedulerWorker = new Worker(
    'BackupChecker',
    async () => {
      logger.log(LogMode.INFO, 'Running Task');

      const checkedBackups = await rrController.checkBackups();

      await rrController.postTeamsDigest(checkedBackups);

      logger.log(LogMode.INFO, 'Posted to Teams');
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'Redis',
      },
      concurrency: 1,
    },
  );

  const cron = appConfig.schedule || `*/5 * * * *`;

  const parsedCRON = parser.parseExpression(cron, {
    currentDate: appConfig.scheduleStartTime
      ? new Date(appConfig.scheduleStartTime)
      : undefined,
  });

  const prevCRON = parsedCRON.prev();
  const startDate = prevCRON.toDate();

  logger.log(LogMode.DEBUG, `scheduleWorker: `, schedulerWorker);

  if (appConfig.overwriteSchedule === true) {
    logger.log(LogMode.INFO, 'Cleaning existing tasks to reset schedule');
    await CheckerQue.clean(0, 100);
  }

  const job = await CheckerQue.add('BackupChecker', appConfig, {
    jobId: 'backups',
    repeat: {
      cron,
      startDate,
    },
  });

  return job;
}
