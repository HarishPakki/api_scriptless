module.exports = {
    content: [
      './src/**/*.{js,jsx,ts,tsx}',
      './node_modules/flowbite/**/*.js',
    ],
    theme: {
      extend: {
        colors:{
          primary:{
            button: '#3498db'
          }
        }
      },
    },
    plugins: [
      require('flowbite/plugin'),
    ],
  };
  