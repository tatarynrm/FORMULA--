export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['web', 'api', 'shared', 'config', 'docker', 'deploy', 'docs', 'deps'],
    ],
    'subject-case': [0],
  },
};
