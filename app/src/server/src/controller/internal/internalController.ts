import { Router } from 'express'
import { menuController } from './menuController'
import { paymentsController } from './paymentsController'
import { schedulerController } from './schedulerController'
import { triggersController } from './triggersController'

export const internalController = Router()

internalController.use('/scheduler', schedulerController)
internalController.use('/triggers', triggersController)
internalController.use('/payments', paymentsController)
internalController.use('/menu', menuController)
