import express from 'express';
import mongoose from 'mongoose'
import bodyParser from 'body-parser';
import { CountryRoutes } from '../routes/countryRoutes';
import { CityRoutes } from '../routes/cityRoutes';
import { TemperatureRoutes } from '../routes/temperatureRoutes';
import * as dotenv from 'dotenv';

class App {

  public app: express.Application;
  public mongoUrl: string = 'mongodb://mongo:27017/db-sprc';

  private country_routes: CountryRoutes = new CountryRoutes();
  private city_routes: CityRoutes = new CityRoutes();
  private temperature_routes: TemperatureRoutes = new TemperatureRoutes();

  constructor() {
    this.app = express();
    this.config();
    this.mongoSetup();
    this.country_routes.route(this.app);
    this.city_routes.route(this.app);
    this.temperature_routes.route(this.app);
  }

  private config(): void {
    dotenv.config();
    // support application/json type post data
    this.app.use(bodyParser.json());
    //support application/x-www-form-urlencoded post data
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private mongoSetup(): void {
    mongoose.connect(this.mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
    console.log('Connected to MongoDB!');
  }
}
export default new App().app;
