// app.config.js

export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE; // "preview", "production", etc.

  // Base config – this is basically your current app.json
  const baseConfig = {
    ...config,
    name: 'Cohortle',
    slug: 'cohortz',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/iconOne.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon-one.png',
        backgroundColor: '#ffffff',
      },
      // default package (e.g. for production / local dev)
      package: 'com.thetrueseeker.cohortz',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'c439ba9d-8f47-4800-8426-d7000c7b6130',
      },
    },
    runtimeVersion: '1.0.0',
    updates: {
      url: 'https://u.expo.dev/c439ba9d-8f47-4800-8426-d7000c7b6130',
    },
  };

  // Modify things based on EAS build profile
  if (profile === 'preview') {
    baseConfig.android = {
      ...(baseConfig.android || {}),
      package: 'com.thetrueseeker.cohortz.preview',
    };
  }

  return baseConfig;
};
