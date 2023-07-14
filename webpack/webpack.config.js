const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
   mode: "production",
   entry: {
      main: path.resolve(__dirname, "..", "src", "main.ts")
   },
   output: {
      path: path.resolve(__dirname, "../dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js", ".css"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            {
               from: path.resolve(__dirname, "..", "src", "css"),
               to: 'css'
            }
         ]
      })
   ]
};