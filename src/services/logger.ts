import colors from 'colors';

const logger = {
    info(message: string) {
        console.log(`${new Date().toISOString()} - ${colors.blue('INFO')}: ${message}`);
    },
    warn(message: string) {
        console.warn(`${new Date().toISOString()} - ${colors.yellow('WARN')}: ${message}`);
    },
    error(message: string, error?: Error | unknown) {
        console.error(`${new Date().toISOString()} - ${colors.red('ERROR')}: ${message}`);
        console.error(error);
    },
};

export default logger;