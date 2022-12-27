const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertdistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertdistrictDbObjectToResponseObject2 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertdistrictDbObjectToTotalObject = (dbObject) => {
  return {
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const statesArray = await database.get(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/districts/", async (request, response) => {
  const getDistrictsQuery = `
    SELECT
      *
    FROM
      district;`;
  const districtsArray = await database.all(getDistrictsQuery);
  response.send(
    districtsArray.map((eachDistrict) =>
      convertdistrictDbObjectToResponseObject(eachDistrict)
    )
  );
});

app.get("/districts/:districtId/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      *
    FROM
      district;`;
  const districtArray = await database.get(getMoviesQuery);
  response.send(convertdistrictDbObjectToResponseObject2(districtArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
            UPDATE
              district
            SET
              district_name = '${districtName}',
              state_id = ${stateId},
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths}
            WHERE
              district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `
    SELECT
      sum(cases) as total_cases,sum(cured) as total_cured,sum(active) as total_active,sum(deaths) as total_deaths
    FROM
      district
    WHERE
      state_id = ${stateId};`;
  const TotalStatsArray = await database.get(getTotalQuery);
  response.send(convertdistrictDbObjectToTotalObject(TotalStatsArray));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const getStateNameQuery = `
    SELECT
      state.state_name
    FROM
      district INNER JOIN state ON
      district.state_id = state.state_id;`;
  const stateName = await database.get(getStateNameQuery);
  response.send({ stateNAme: stateName.state_name });
});

module.exports = app;
