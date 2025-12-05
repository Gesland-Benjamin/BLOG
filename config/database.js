import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize('blog', 'ben', '', {
  host: 'localhost',  // seulement le host
  port: 5432,         // port PostgreSQL par défaut
  dialect: 'postgres',
});