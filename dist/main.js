// imports
const { OpenSeaPort, Network } = window;

// --- constants
const DEFAULT_NETWORK = Network.Main;
// const PROVIDER_URL = "https://mainnet.infura.io/v3/78ae782ed28e48c0b3f74ca69c4f7ca8"; // need replase

// --- fulfill order params for replase

function parseGetQuery(queryString) {
  let query = {};
  var pairs = (queryString[0] === "?"
    ? queryString.substr(1)
    : queryString
  ).split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return query;
}

/**
 * @returns object provider
 * @throws Exception
 * */
const getProivder = async () => {
  let provider = null;
  if (window.ethereum) {
    provider = window.ethereum;
    try {
      await window.ethereum.enable();
    } catch (error) {
      throw new Error("User Rejected");
    }
  } else if (window.web3) {
    provider = window.web3.currentProvider;
  } else {
    throw new Error("No Web3 Provider found");
  }
  return provider;
};

const getAccounts = async () => {
  let accounts = [];
  if (window.ethereum) {
    const accountsPromise = new Promise((resolve, reject) => {
      try {
        if (window.web3) {
          const solve = (e, accs) => (e !== null ? reject(e) : resolve(accs));
          window.web3.eth.getAccounts(solve);
        } else {
          throw new Error("You must have web3 to continue");
        }
      } catch (err) {
        reject(err);
      }
    });
    try {
      window.web3 = new Web3(ethereum); // eslint-disable-line no-undef
      accounts = await window.ethereum.enable();
      accounts = !accounts ? await accountsPromise() : accounts;
      return accounts;
    } catch (err) {
      throw new Error("requestAccess error");
    }
  } else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider); // eslint-disable-line no-undef
    accounts = window.web3.eth.accounts; // eslint-disable-line no-undef
    return accounts;
  } else {
    throw new Error("No Web3 Provider found");
  }
};

// --- init seaport
const config = {};
// const provider = new Web3.providers.HttpProvider(PROVIDER_URL);

/**
 * @returns {Promise<{error, success}>}
 **/
const fulfillOrder = async ({
  tokenId,
  tokenContract,
  // accountAddress,
  referrerAddress
}) => {
  const orderParams = {
    sale: 1, // OrderSide.Sell
    asset_contract_address: tokenContract, // string
    token_id: parseInt(tokenId, 10) // number
  };

  let result = {
    error: "",
    success: false
  };

  try {
    let { seaport } = window;

    if (!seaport) {
      const provider = await getProivder();

      seaport = new OpenSeaPort(provider, {
        ...config,
        networkName:
          config && "networkName" in config
            ? config.networkName
            : DEFAULT_NETWORK
      });

      window.seaport = seaport;
    }

    const accounts = await getAccounts();
    const order = await seaport.api.getOrder(orderParams);
    if (order) {
      await seaport.fulfillOrder({
        order,
        accountAddress: accounts[0],
        referrerAddress
      });
      result.success = true;
    } else {
      result.error = "not found order";
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
};

const sendResponse = response => {
  console.log("sendResponse", response);
  const { webkit } = window;
  let isSendMessage = false;

  // AlexPro, hi! :)
  if (webkit && "messageHandlers" in webkit) {
    const { messageHandlers } = webkit;
    if ("notification" in messageHandlers) {
      const { notification } = messageHandlers;
      notification.postMessage(response);
      isSendMessage = true;
    }
  }

  // others
  if (!isSendMessage) {
    // console.log(response)
    window.location.search = `?error=${response.error}&success=${response.success}`;
  }
};
