'use strict';
const WebSocket = require('websocket').w3cwebsocket;
const requestP = require('request-promise-native');
const Logger = require('./../config/winston');
const _ = require('lodash');


const monitorUnconfirmedTxs = function monitorBitcoinUnconfirmedTxs() {
    
    const getUnconfirmedTx = async () => {
		const options = {
            method: 'GET',
            url: `https://blockchain.info/unconfirmed-transactions?format=json`,
            headers: {'Cache-Control': 'no-cache'}
        };
        try {
			const response = await requestP(options);
            return response;
        } catch (err) {
            throw err;
        }
    }
    const sumUnconfirmedTxs = (unconfirmedTxs) => {

        const parsedTxs = JSON.parse(unconfirmedTxs);
        const txArray = parsedTxs.txs;

        const outputs = _.map(txArray, (value) => {
            return value.out;
        });

        const outputValues = _.map(outputs, (txoutput) => {
            let sum = 0;
            _.forEach(txoutput, (value) => {
                if (value.value){
                    sum = sum + value.value
                }
                return;
            });
            return sum;
        })

        const sumOfUnconfirmedTxs = _.reduce(outputValues, (sum, n) => {
            return sum + n;
        }, 0);

        // Logger.info('%o', outputs);
        // Logger.info('%o', outputValues);
        Logger.info('%o', sumOfUnconfirmedTxs);
        return;
    }

    const connectToBlockchainInfo = async () => {
		try {
	        const websocket = await new WebSocket(`wss://ws.blockchain.info/inv`);
	        websocket.onopen = (event) => Logger.info('websocket Open');
	        websocket.onclose = (event) => Logger.info('websocket Close', event);
	        websocket.onerror = (event) => Logger.info('websocket Error:', event);
	        websocket.onmessage = (event) => Logger.info('websocket message: ', event);
	        return websocket;
	    }
	    catch (err) {
	    	throw err; 
		}
    }

    connectToBlockchainInfo()
    .then( (blockchainInfoWS) => {
        blockchainInfoWS.onopen = (event) => {
            Logger.info('LOG!')
            // blockchainInfoWS.send(JSON.stringify({op:'ping'}));
            blockchainInfoWS.send(JSON.stringify({op: 'unconfirmed_sub'}));
        };
        blockchainInfoWS.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);

            const outputs = parsedData.x.out;

            // const outputValues = _.map(outputs, (txoutput) => {
                let sum = 0;
            //     Logger.info('%o', txoutput);
                _.forEach(outputs, (value) => {
                    if (value.value){
                        sum = sum + value.value
                    }
                    return;
                });
            //     return sum;
            // });

            Logger.info('%o', sum);

            // const sumOfUnconfirmedTxs = _.reduce(outputValues, (sum, n) => {
            //     return sum + n;
            // }, 0);



            // Logger.info('%o', outputs);
            // Logger.info('%o', outputValues);
            
            return;



            // Logger.info('Blockchain.info WS message: %o', parsedData);
        }
        return blockchainInfoWS;
    }).catch( (error) => {
        throw error;
    });

	getUnconfirmedTx()
    .then( sumUnconfirmedTxs )
    .catch( (error) => {
        throw error;
    });



}

module.exports = monitorUnconfirmedTxs;