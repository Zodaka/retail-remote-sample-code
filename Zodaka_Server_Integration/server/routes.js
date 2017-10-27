import { Router } from 'express'

import { zodakaAPI } from './models'

const merchantRouter = Router()

/**
 * The /order route initiates the process of the merchant server
 * communicating with the Zodaka Payments API to create
 * a new order_token in the Zodaka System.
 */
merchantRouter.post('/order', createNewOrder)

/**
 * The /order/:token/status route gets the order status
 * from the Zodaka Payments API.
 */
merchantRouter.get('/order/:token/status', getOrderStatus)

/**
 * The /order/:token/pay route initiates the process of the
 * merchant server communicating with the Zodaka Payments API
 * to complete an order in the Zodaka System.
 */
merchantRouter.post('/order/:token/pay', confirmPayment)

async function createNewOrder(request, response, next) {
  try {
    const { amount } = request.body
    const token = await zodakaAPI.newOrder(amount)

    response.send(token)

  } catch (error) {
    next(error) 
  }
}

async function confirmPayment(request, response, next) {
  try {
    const { token } = request.params
    await zodakaAPI.pay(token)

    response.send('Payment completed')

  } catch (error) {
    next(error) 
  }
}

async function getOrderStatus(request, response, next) {
  try {
    const { token } = request.params
    const paymentReady = await zodakaAPI.orderStatusFor(token)

    response.send({ payment_ready: paymentReady })

  } catch (error) {
    next(error)
  }
}

export default merchantRouter