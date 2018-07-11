'use strict'
const svg2png = require('svg2png')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const AppManifestWebpackPlugin = require('app-manifest-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const devWebpackConfig = merge(baseWebpackConfig, {
    module: {
        rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
    },
    // cheap-module-eval-source-map is faster for development
    devtool: config.dev.devtool,

    // these devServer options should be customized in /config/index.js
    devServer: {
        clientLogLevel: 'warning',
        historyApiFallback: {
            rewrites: [
                { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
            ],
        },
        hot: true,
        contentBase: false, // since we use CopyWebpackPlugin.
        compress: true,
        host: HOST || config.dev.host,
        port: PORT || config.dev.port,
        open: config.dev.autoOpenBrowser,
        overlay: config.dev.errorOverlay
        ? { warnings: false, errors: true }
        : false,
        publicPath: config.dev.assetsPublicPath,
        proxy: config.dev.proxyTable,
        quiet: true, // necessary for FriendlyErrorsPlugin
        watchOptions: {
            poll: config.dev.poll,
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': require('../config/dev.env')
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
        new webpack.NoEmitOnErrorsPlugin(),
        new AppManifestWebpackPlugin({
            logo: path.resolve(__dirname, '../src/assets/logo.svg'),
            prefix: '.',
            output: '/static/icons-[hash:8]/',
            inject: true,
            persistentCache: true,
            config: {
                appName: 'Cyclassist',
                appDescription: "Track and share issues (work, interruption in routes, parked cars) on bike lanes in realtime.",
                developerName: 'Phyks (Lucas Verney)',
                developerURL: 'https://phyks.me',
            }
        }),
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            ogURL: config.build.ogURL,
            ogImage: config.build.ogImage,
            inject: true
        }),
        // copy custom static assets
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, '../static'),
                to: config.build.assetsSubDirectory,
                ignore: ['.*']
            },
            {
                from: path.resolve(__dirname, '../src/assets/logo.svg'),
                to: path.join(config.build.assetsSubDirectory, 'ogIcon.png'),
                transform (content, path) {
                    return Promise.resolve(svg2png(content, { width: 400, height: 400 }));
                }
            },
            {
                from: path.resolve(__dirname, '../humans.txt'),
                to: config.build.assetsRoot,
                ignore: ['.*']
            },
            {
                from: path.resolve(__dirname, '../robots.txt'),
                to: config.build.assetsRoot,
                ignore: ['.*']
            }
        ])
    ]
})

module.exports = new Promise((resolve, reject) => {
    portfinder.basePort = process.env.PORT || config.dev.port
    portfinder.getPort((err, port) => {
        if (err) {
            reject(err)
        } else {
            // publish the new Port, necessary for e2e tests
            process.env.PORT = port
            // add port to devServer config
            devWebpackConfig.devServer.port = port

            // Add FriendlyErrorsPlugin
            devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
                compilationSuccessInfo: {
                    messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
                },
                onErrors: config.dev.notifyOnErrors
                ? utils.createNotifierCallback()
                : undefined
            }))

            resolve(devWebpackConfig)
        }
    })
})
