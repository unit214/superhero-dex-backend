import { SubscriptionEvent } from '../../src/clients/mdw-ws-client.model';

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

export const swapTxInfo = {
  callInfo: {
    callerId: 'ak_2kE1RxHzsRE4LxDFu6WKi35BwPvrEawBjNtV788Gje3yqADvwR',
    callerNonce: '969',
    height: 604226,
    contractId: 'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
    gasPrice: 1000000000n,
    gasUsed: 69728,
    log: [
      {
        address: 'ct_2JZNDfAQHZMfoBuh32Aijd9TR8A5SHUVBzxC6x5d4sS7o8xeqN',
        topics: [
          '72742236172837736358043391645586411318758140104138559400527506523271326125229',
          '20886355818340092739040507058882636056327209568693182558654441272249536821659',
          '103960525306736591470929395957518535141396498803550936451395137233535039047786',
        ],
        data: 'cb_MTAwMDAwMDAwMDAwMDAwMDAwMHwwfDB8NzY0Mzc0ODQ2Mzg5NDM1MjU2ObFPG3M=',
      },
      {
        address: 'ct_2JZNDfAQHZMfoBuh32Aijd9TR8A5SHUVBzxC6x5d4sS7o8xeqN',
        topics: [
          '24432301949580458371007546625426791671600583970925974457610567576514658171178',
          '20455212561419846069480',
          '156817307769831012081998',
        ],
        data: 'cb_Xfbg4g==',
      },
      {
        address: 'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
        topics: [
          '15485047184846566156736396069994907050875216973023180189891727495730853981167',
          '77600490262706011337158980498724931083208275001028702729829623155049351662439',
          '103960525306736591470929395957518535141396498803550936451395137233535039047786',
          '7643748463894352569',
        ],
        data: 'cb_Xfbg4g==',
      },
      {
        address: 'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
        topics: [
          '15485047184846566156736396069994907050875216973023180189891727495730853981167',
          '20886355818340092739040507058882636056327209568693182558654441272249536821659',
          '77600490262706011337158980498724931083208275001028702729829623155049351662439',
          '1000000000000000000',
        ],
        data: 'cb_Xfbg4g==',
      },
      {
        address: 'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
        topics: [
          '41351702065710532483578406672343054931429779004654879061244444772998706402323',
          '20886355818340092739040507058882636056327209568693182558654441272249536821659',
          '1000000000000000000',
        ],
        data: 'cb_Xfbg4g==',
      },
    ],
    returnValue: 'cb_I2+IDeC2s6dj/8BviDdWMlDilUHN2k8STg==',
    returnType: 'ok' as const,
  },
};
