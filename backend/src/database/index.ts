import config from 'config'
import { Sequelize } from 'sequelize'
import { isDev } from 'utils'
const { dataBaseConfig } = config

const {  options } = dataBaseConfig

const sequelize = new Sequelize( {
  ...options,
  logging: isDev ? console.log : false, // 是否输出数据库日志
})

const init = async () => {
  await sequelize.sync({ alter: isDev })
  console.log('All models were synchronized successfully.')
}
export { init }
export default sequelize
