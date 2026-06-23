module.exports = {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|js)$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                skipLibCheck: true,
                allowJs: true,
            },
        }],
    },
    testMatch: ['**/__tests__/**/*.test.js'],
};