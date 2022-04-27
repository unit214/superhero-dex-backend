import * as mdw from '../src/worker/middleware';

it.skip('just connect', async () => {
  let future;
  const promise = new Promise((resolve, reject) => {
    future = { resolve, reject };
  });
  const ws = await mdw.createNewConnection({
    onDisconnected: (error) => {
      if (error) {
        console.log(error);
        future?.reject(error);
      } else {
        future?.resolve();
      }
    },
    onConnected: () => {
      console.log('CONNECTED');
      ws.close();
    },
  });

  await promise;
});

//TODO: further  testing after mockup the ws
