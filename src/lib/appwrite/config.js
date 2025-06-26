//This is the config file to make the project more modular all the needed enviroment keys are called here and exported so that we can use them from anywhere

import { Account, Client, Databases } from "appwrite"

export const appwriteConfig ={
  projectId : import.meta.env.VITE_APPWRITE_PROJECT_ID,
  url : import.meta.env.VITE_APPWRITE_URL,
  databaseId : import.meta.env.VITE_APPWRITE_DATABASE_ID,
  routesCollectionId : import.meta.env.VITE_APPWRITE_ROUTES_COLLECTION_ID,
  schedulesCollectionId : import.meta.env.VITE_APPWRITE_SCHEDULES_COLLECTION_ID,
  usageLogCollectionId : import.meta.env.VITE_APPWRITE_USAGE_LOG_COLLECTION_ID,
  busesCollectionId: import.meta.env.VITE_APPWRITE_BUSES_COLLECTION_ID,
  stopsCollectionId: import.meta.env.VITE_APPWRITE_STOPS_COLLECTION_ID,
  reservationCollectionId: import.meta.env.VITE_APPWRITE_RESERVATIONS_COLLECTION_ID,

}

export const client = new Client();
client
.setProject(appwriteConfig.projectId)
.setEndpoint(appwriteConfig.url);

export const account = new Account(client);
export const databases = new Databases(client);