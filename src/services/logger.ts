import colors from 'colors';

const logger = {
    info(message: string) {
        console.log(`${new Date().toISOString()} - ${colors.blue('INFO')}: ${message}`);
    },
    warn(message: string) {
        console.warn(`${new Date().toISOString()} - ${colors.yellow('WARN')}: ${message}`);
    },
    error(message: string) {
        console.error(`${new Date().toISOString()} - ${colors.red('ERROR')}: ${message}`);
    },
};

export default logger;