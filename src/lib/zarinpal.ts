import axios from 'axios';

// ==================== Config ====================

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '';
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.zarinpal.com'
  : 'https://payment.zarinpal.com';

const API_URL = `${BASE_URL}/pg/v4/payment`;

// ==================== Payment Request ====================

interface PaymentRequestOptions {
  amount: number;
  description: string;
  callbackUrl: string;
  email?: string;
  mobile?: string;
}

interface PaymentRequestResult {
  authority: string;
  url: string;
}

export const createPaymentRequest = async (
  options: PaymentRequestOptions
): Promise<PaymentRequestResult> => {
  const { amount, description, callbackUrl, email, mobile } = options;

  const requestBody: any = {
    merchant_id: MERCHANT_ID,
    amount,
    callback_url: callbackUrl,
    description,
  };

  if (email || mobile) {
    requestBody.metadata = {};
    if (email) requestBody.metadata.email = email;
    if (mobile) requestBody.metadata.mobile = mobile;
  }

  try {
    const response = await axios.post(`${API_URL}/request.json`, requestBody);

    const { data, errors } = response.data;

    if (errors && errors.message) {
      throw new Error(`Zarinpal error: ${errors.message}`);
    }

    if (data.code !== 100) {
      throw new Error(`Payment request failed: code ${data.code}`);
    }

    return {
      authority: data.authority,
      url: `${BASE_URL}/pg/StartPay/${data.authority}`,
    };
  } catch (error: any) {
    throw new Error(
      `Payment request failed: ${JSON.stringify(error.response?.data) || error.message}`
    );
  }
};

// ==================== Payment Verification ====================

interface PaymentVerifyResult {
  refId: string;
  cardPan: string;
}

export const verifyPayment = async (
  authority: string,
  amount: number
): Promise<PaymentVerifyResult> => {
  try {
    const response = await axios.post(`${API_URL}/verify.json`, {
      merchant_id: MERCHANT_ID,
      amount,
      authority,
    });

    const { data, errors } = response.data;

    if (errors && errors.message) {
      throw new Error(`Zarinpal error: ${errors.message}`);
    }

    if (data.code !== 100 && data.code !== 101) {
      throw new Error(`Payment verification failed: code ${data.code}`);
    }

    return {
      refId: data.ref_id.toString(),
      cardPan: data.card_pan || '',
    };
  } catch (error: any) {
    throw new Error(
      `Payment verification failed: ${JSON.stringify(error.response?.data) || error.message}`
    );
  }
};
