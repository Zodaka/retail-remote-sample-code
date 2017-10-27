import axios from 'axios'
import uuid from 'uuid/v1'

import { mockDatabase } from './mockDatabase'

import {
  ZODAKA_API_BASE_URL,
  ZODAKA_API_TOKENS_HEADERS
} from './constants'

/**
 * This is a sample Zodaka Payments API interface.
 *
 * In the RETAIL-REMOTE flow for the merchant
 * server, one needs to create a new order, check its
 * status for payment readiness, then take payment
 * for order, totaling three routes for complete
 * integration.
 *
 */

class ZodakaAPI {
  /**
   * This socket.io object is for show purposes only,
   * though such a connection can be used in the real merchant POS.
   *
  */
  websocketConnection = {}

  async newOrder(amount) {
    /**
     * The newOrderRequestBody is the required body keys and values
     * to create a new order in the Zodaka System.
     */
    const newOrderRequestBody = {
      merchant_id: 1,
      merchant_order_value: amount,
      merchant_callback_url: process.env.MERCHANT_CALLBACK_URL || 'https://mjdemo-retail.zodaka.com/callback',
      merchant_order_id: uuid(),
      merchant_order_metadata: { some_data: 'data' },
      merchant_order_type: 'RETAIL-REMOTE'
    }

    try {
      /**
       * POST request with appropriate headers and body for the
       * Zodaka Payments API.
      */
      const { data: order } = await axios.post(
        ZODAKA_API_BASE_URL,
        newOrderRequestBody,
        ZODAKA_API_TOKENS_HEADERS
      )

      /**
       * New order response from the Zodaka API is console logged
       * for easy viewing during test integration.
      */
      console.log('New order :::- ', order)

      /**
       * This mockDatabase is just that, a mock. The intention here
       * is to show that the order information will need to be saved
       * for future retrieval in the manner the merchant deems fit
       * for their backend.
       */
      mockDatabase.save(order)

      /**
       * Websocket connection to tell the merchant POS that a new
       * order has been created.
       */
      this.websocketConnection.emit(
        'newOrder',
        { token: order.order_token, payment_ready: false }
      )

      return { token: order.order_token }

    } catch (error) {
      console.log('Error occured :', error.message)
      throw error
    }
  }


  async orderStatusFor(token) {
    /* Zodaka API endpoint to hit for order status */
    const ZODAKA_ORDER_STATUS_URL = `${ZODAKA_API_BASE_URL}/${token}/status`

    try {
      /* Currently for getting the order status, no auth headers required */
      const { data: orderStatus } = await axios.get(ZODAKA_ORDER_STATUS_URL)

      /**
       * The order status response is console logged for easy viewing
       * during test integration.
       */
      console.log('Order status details :::- ', orderStatus)

      /* Mock database call to imitate update of relevant data */
      mockDatabase.update(
        token,
        orderStatus
      )

      /**
       * Websocket connection to tell the merchant POS that an
       * order has been updated. The demo POS is specifically
       * interested in the payment_ready field, and the others
       * are important for displaying then removing completed
       * payments.
       */
      this.websocketConnection.emit(
        'updateOrder',
        {
          token,
          payment_ready: orderStatus.payment_ready,
          payment_completed: orderStatus.payment_completed
        }
      )

      return orderStatus.payment_ready

    } catch (error) {
      console.log('Error occured :', error.message)
      throw error
    }
  }

  async pay(token) {
    /* Zodaka API endpoint for taking payment for order */
    const ZODAKA_PAY_URL = `${ZODAKA_API_BASE_URL}/${token}/pay`

    try {
      /**
       * POST request with appropriate headers and body for the
       * Zodaka Payments API to initiate payment to merchant.
      */
      const { data: paymentDetails } = await axios.post(
        ZODAKA_PAY_URL,
        {},
        ZODAKA_API_TOKENS_HEADERS
      )

      /**
       * The payment response is console logged for easy viewing
       * during test integration.
       */
      console.log('Payment details :::- ', paymentDetails)

      /* Mock database call to imitate update of relevant data */
      mockDatabase.update(
        token,
        paymentDetails
      )

      /**
       * Websocket connection to tell the merchant POS that an
       * order has been completed.
       */
      this.websocketConnection.emit(
        'orderCompleted',
        { token }
      )

    } catch (error) {
      console.log('Error occured :', error.message)
      throw error
    }
  }

  connect(socket) {
    this.websocketConnection = socket
  }

  disconnect() {
    this.websocketConnection = {}
  }
}

export const zodakaAPI = new ZodakaAPI()