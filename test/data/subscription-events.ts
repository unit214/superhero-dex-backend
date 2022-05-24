import { SubscriptionEvent } from '../../src/worker/middleware';
import { TxInfo } from '../../src/lib/contracts';

export const objSubEv: SubscriptionEvent = {
  subscription: 'Object',
  source: 'source',
  payload: {
    tx: {
      version: 1,
      nonce: 1,
      fee: 1,
      amount: 1,
      type: 'ContractCallTx', // add any other additional enum values if are used
      gas_price: 1,
      gas: 1,
      contract_id: 'ct_1',
      caller_id: 'ak_1',
      call_data: 'cb_1',
      abi_version: 1,
    },
    signatures: [],
    hash: 'th_1',
    block_height: 1,
    block_hash: 'mh_1',
  },
};
export const txSubEv: SubscriptionEvent = {
  ...objSubEv,
  subscription: 'Transactions',
};
export const swapEvent: SubscriptionEvent = {
  subscription: 'Transactions',
  source: 'node',
  payload: {
    tx: {
      version: 1,
      type: 'ContractCallTx',
      nonce: 969,
      gas_price: 1000000000,
      gas: 150000,
      fee: 184860000000000,
      contract_id: 'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
      caller_id: 'ak_2kE1RxHzsRE4LxDFu6WKi35BwPvrEawBjNtV788Gje3yqADvwR',
      call_data:
        'cb_KxGgrHPPa2+IDeC2s6dj/8BviDS6ZTPQa3LdI58CoA+jduXx2lWO56qpkcyYegDPEXsvjZYgC3Z4A6FQn/dBnwKgTXIk+QipjYUkNnGNIj1ZprZMgRF6awlXqrSIIMLSXZifAKDl15J29uSuZc3z1ZG2rDJhj05+ymUb+Vx+U6wgnnIIam+GAYDOXr5Pr4IAAQA/4T/nfw==',
      amount: 0,
      abi_version: 3,
    },
    signatures: [
      'sg_MpNY2rVYFcFoBupPo6hc7SQfBgJphfvGUvdJS86w5YFw1JuhdUuMmiNUvxgDoPMh2aiYYsvw3WCuS3nu8EggZCn6HDVdu',
    ],
    hash: 'th_2FW9cvgzeaQRtoLYC8pTNSQFTaTnUbkVsRmyDXWJ4pWcePELBH',
    block_height: 604226,
    block_hash: 'mh_RgFwhsL9vNmfVcRw7XSQPv4HZwsbsGih14ossq45JGi7i67Vy',
  },
};

export const swapTxInfo: TxInfo = {
  callerId: 'ak_2kE1RxHzsRE4LxDFu6WKi35BwPvrEawBjNtV788Gje3yqADvwR',
  callerNonce: 969,
  contractId: 'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
  gasPrice: 1000000000,
  gasUsed: 69728,
  height: 604226,
  log: [
    {
      address: 'ct_efYtiwDg4YZxDWE3iLPzvrjb92CJPvzGwriv4ZRuvuTDMNMb9',
      data: 'cb_MTAwMDAwMDAwMDAwMDAwMDAwMHwwfDB8Mzk4NzQyOTg0MzA2MzM1Nzk2NdD6IeE=',
      topics: [
        '72742236172837736358043391645586411318758140104138559400527506523271326125229',
        '20886355818340092739040507058882636056327209568693182558654441272249536821659',
        '103960525306736591470929395957518535141396498803550936451395137233535039047786',
      ],
    },
    {
      address: 'ct_efYtiwDg4YZxDWE3iLPzvrjb92CJPvzGwriv4ZRuvuTDMNMb9',
      data: 'cb_Xfbg4g==',
      topics: [
        '24432301949580458371007546625426791671600583970925974457610567576514658171178',
        '1000074099999999999999943',
        '3999720485641811331280061',
      ],
    },
    {
      address: 'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
      data: 'cb_Xfbg4g==',
      topics: [
        '15485047184846566156736396069994907050875216973023180189891727495730853981167',
        '38682790645316314696523657523046744669000345202112459709288660581833845680137',
        '103960525306736591470929395957518535141396498803550936451395137233535039047786',
        '3987429843063357965',
      ],
    },
    {
      address: 'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      data: 'cb_Xfbg4g==',
      topics: [
        '6675387653529534352993899574763440621350730065146058041830673378811230846814',
        '103960525306736591470929395957518535141396498803550936451395137233535039047786',
        '20886355818340092739040507058882636056327209568693182558654441272249536821659',
        '116666599550000000000000000',
      ],
    },
    {
      address: 'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      data: 'cb_Xfbg4g==',
      topics: [
        '15485047184846566156736396069994907050875216973023180189891727495730853981167',
        '103960525306736591470929395957518535141396498803550936451395137233535039047786',
        '38682790645316314696523657523046744669000345202112459709288660581833845680137',
        '1000000000000000000',
      ],
    },
  ],
  returnType: 'ok',
  returnValue: 'cb_I2+IDeC2s6dj/8BviDdWMlDilUHN2k8STg==',
};
