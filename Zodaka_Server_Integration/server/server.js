import dotenv from 'dotenv'
dotenv.config()

import '@babel/polyfill'

import express from 'express'
import webSocket from 'socket.io'
import cors from 'cors'
import { Server } from 'http'
import bodyParser from 'body-parser'

import merchantAPI from './routes'
import notFound from './notFound'
import errorHandler from './errorHandler'
import { zodakaAPI as merchantServer } from './models'

const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use('/', merchantAPI)
app.use('*', notFound)
app.use(errorHandler)

const server = Server(app)
const io = webSocket(server)
const port = 8081

/* 
 * For this code sample, we include a websocket connection
 * to mock a POS. We image that merchants will use such a POS
 * to complete sales for this RETAIL-REMOTE order_type.
 */
io.on('connection', socket => {
  merchantServer.connect(socket)
  console.log('Merchant POS computer connected...')

  socket.on('disconnect', () => {
    merchantServer.disconnect()
    console.log('Merchant POS computer disconnected...')
  })
})

server.listen(port, () => console.log(`Merchant's retail-remote demo server running on port: ${port}`))
