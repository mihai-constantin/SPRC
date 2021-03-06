import { Request, Response } from 'express';
import { requestResponse } from '../errors';
import { response_status_codes } from '../errors/model';
import Temperature from '../models/temperatureModel';

import TemperatureService from "../services/temperatureServices";
import CityService from "../services/cityServices";
import ContryService from '../services/countryServices';

export class TemperatureController {

  private temperature_service: TemperatureService = new TemperatureService();
  private city_service: CityService = new CityService();
  private country_service: ContryService = new ContryService();

  public filter_temperatures(req: Request, temperatures: any[]): any[] {
    if (req.query.from) {
      // remove temperatures that have timestamp lower than req.query.from
      let from_date = new Date(JSON.stringify(req.query.from));
      for (var _i = 0; _i < temperatures.length; _i++) {
        let temp_date = new Date(temperatures[_i].timestamp);
        if (temp_date < from_date) {
          temperatures.splice(_i, 1);
          _i--;
        }
      }
    }
    if (req.query.until) {
      // remove temperatures that have timestamp bigger than req.query.until
      let until_date = new Date(JSON.stringify(req.query.until));
      for (var _i = 0; _i < temperatures.length; _i++) {
        let temp_date = new Date(temperatures[_i].timestamp);
        if (temp_date > until_date) {
          temperatures.splice(_i, 1);
          _i--;
        }
      }
    }
    return temperatures;
  }

   // -----    GET    -----
   public async get_all_temperatures(req: Request, res: Response) {
    console.log('Getting all temperatures from database...');
    try {
      let cities = [];
      if (req.query.lat && req.query.lon) {
        cities = await this.city_service.getCities({latitude: req.query.lat, longitude: req.query.lon});
      } else if (req.query.lat) {
        cities = await this.city_service.getCities({latitude: req.query.lat});
      } else if (req.query.lon) {
        cities = await this.city_service.getCities({longitude: req.query.lon});
      } else {
        cities = await this.city_service.getCities({});
      }
      let temperatures: any[] = [];
      for (let city of cities) {
        let current_temperatures = await this.temperature_service.getTemperatures({city_id: city._id});
        temperatures.push.apply(temperatures, current_temperatures);
      }
      temperatures = this.filter_temperatures(req, temperatures);
      requestResponse(response_status_codes.success, temperatures, res);
    } catch (err) {
      requestResponse(response_status_codes.internal_server_error, `Unable to get temperatures from database because ${err}`, res);
    }
  }

  // -----    GET BY ID    -----
  public async get_temperature_by_id(req: Request, res: Response) {
    console.log("Getting temperature by id...");
    try {
      let temperature = await this.temperature_service.getTemperatureById(req.params.temperatureId);
      if (temperature) {
        requestResponse(response_status_codes.success, temperature, res);
      } else {
        requestResponse(response_status_codes.not_found, 'Temperature not found into database.', res);
      }
    } catch (err) {
      requestResponse(response_status_codes.not_found, 'Invalid temperature id format.', res);
    }
  }

  // -----    GET BY CITY    -----
  public async get_temperatures_by_city(req: Request, res: Response) {
    console.log("Getting temperatures by city...");
    try {
      let city = await this.city_service.getCityById(req.params.cityId);
      if (city) {
        let temperatures = await this.temperature_service.getTemperatures({city_id: req.params.cityId});
        temperatures = this.filter_temperatures(req, temperatures);
        requestResponse(response_status_codes.success, temperatures, res);
      } else {
        requestResponse(response_status_codes.not_found, 'City not found into database.', res);
      }
    } catch (err) {
      requestResponse(response_status_codes.not_found, 'Invalid city id format.', res);
    }
  }

  // -----    GET BY COUNTRY    -----
  public async get_temperatures_by_country(req: Request, res: Response) {
    console.log("Getting temperatures by country...");
    try {
      let country = await this.country_service.getCountryById(req.params.countryId);
      if (country) {
        let cities = await this.city_service.getCities({country_id: req.params.countryId});
        let temperatures: any[] = [];
        for (let city of cities) {
          let current_temperatures = await this.temperature_service.getTemperatures({city_id: city._id});
          temperatures.push.apply(temperatures, current_temperatures);
        }
        temperatures = this.filter_temperatures(req, temperatures);
        requestResponse(response_status_codes.success, temperatures, res);
      } else {
        requestResponse(response_status_codes.not_found, 'Country not found into database.', res);
      }
    } catch (err) {
      requestResponse(response_status_codes.not_found, 'Invalid country id format.', res);
    }
  }

  // -----    POST    -----
  public async create_temperature(req: Request, res: Response) {
    console.log('Saving temperature into database...');
    try {
      if (req.body.value == null || req.body.city_id == null) {
        requestResponse(response_status_codes.bad_request, 'Unable to save temperature into database because some fields are missing in request body.', res);
        return;
      }
      let city = await this.city_service.getCityById(req.body.city_id);
      if (city) {
        let temperature = new Temperature(req.body);
        let current_day = new Date(Date.now());
        temperature.timestamp = current_day.toISOString().split('T')[0];
        await this.temperature_service.createTemperature(temperature);
        requestResponse(response_status_codes.created, temperature, res);
      } else {
        requestResponse(response_status_codes.not_found, 'City not found into database.', res);
      }
    } catch(err) {
      if (err.name == "ValidationError") {
        requestResponse(response_status_codes.bad_request, 'Unable to save temperature into database because some fields are missing in request body.', res);
      } else if (err.code == 11000) {
        let city = await this.city_service.getCityById(req.body.city_id);
        requestResponse(response_status_codes.conflict, `Unable to save temperature into database because the tuple (${city?.name}, ${new Date(Date.now()).toISOString().split('T')[0]}) is already there.`, res);
      } else {
        requestResponse(response_status_codes.not_found, 'Invalid city id format.', res);
      }
    }
  }

  // -----    PUT    -----
  public async update_temperature(req: Request, res: Response) {
    console.log('Updating temperature into database...');
    try {
      let temperature = await this.temperature_service.getTemperatureById(req.params.temperatureId);
      if (temperature) {
        if (req.body.value && req.body.city_id) {
          try {
            let temperature_data = new Date(temperature.timestamp);
            let city = await this.city_service.getCityById(req.body.city_id);
            if (city) {
              let temperatures = await this.temperature_service.getTemperatures({city_id: city._id});
              for (let t of temperatures) {
                let t_data = new Date(t.timestamp);
                if (t_data.getTime() == temperature_data.getTime() && req.params.temperatureId != t._id) {
                  requestResponse(response_status_codes.conflict, `Tuple (${req.body.city_id}, ${t_data.toISOString().split('T')[0]}) already in database.`, res);
                  return;
                }
              }
              temperature.value = req.body.value;
              temperature.city_id = req.body.city_id;
              temperature.save();
              requestResponse(response_status_codes.success, temperature, res);
            } else {
              requestResponse(response_status_codes.not_found, 'City not found into database', res);
            }
          } catch (err) {
            requestResponse(response_status_codes.not_found, 'Invalid city id format.', res);
          }
        } else {
          requestResponse(response_status_codes.bad_request, 'Unable to save temperature into database because some fields are missing in request body.', res);
        }
      } else {
        requestResponse(response_status_codes.not_found, 'Temperature id not found into database.', res);
      } 
    } catch (err) {
      requestResponse(response_status_codes.not_found, 'Invalid temperature id format.', res);
    }
  }

   // -----    DELETE    -----
   public async delete_temperature(req: Request, res: Response) {
    console.log('Deleting temperature from database...');
    try {
      let temperature = await this.temperature_service.getTemperatureById(req.params.temperatureId);
      if (temperature) {
        temperature.remove((err) => {
          if (err) {
            requestResponse(response_status_codes.internal_server_error, `Unable to delete temperature from database, because ${err.message}`, res);
          }
          requestResponse(response_status_codes.success, `Temperature ${temperature?.value} was successfully deleted from databse.`, res);
        });
      } else {
        requestResponse(response_status_codes.not_found, 'Temperature id not found into database.', res);
      }
    } catch (err) {
      requestResponse(response_status_codes.not_found, 'Invalid temperature id format.', res);
    }
  }

}