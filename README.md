# Programmeren 4: Share-a-meal

## Introductie

Hi ik ben Sybrand en ik heb voor het vak Programmeren-4 een Node-JS API gemaakt, deze API kan gebruikt gaan worden voor een online omgeving waarbij mensen maaltijden kunnen gaan aanbieden. Je kunt een account aanmaken en daarop maaltijden plaatsen die jij hebt gemaakt. Hieronder staan alle functionaliteiten van de API verder vermeld.

De link naar mijn server: https://share-a-meal-2183391.herokuapp.com/

## Deze API heeft een aantal end-points met extra functies

#### **Login:**

- **POST**: Aanmaken login _/api/auth/login_

#### **User:**

- **POST**: Aanmaken gebruikers _/api/user_
- **GET**: Ophalen gebruikers _/api/user_
- **GET**: Ophalen 1 gebruiker _/api/user/{id van de gebruiker}_
- **PUT**: Informatie veranderen van een gebruiker _/api/user/{id van de gebruiker}_
- **DELETE**: Verwijder informatie van een gebruiker _/api/user/{id van de gebruiker}_

#### **Meal:**

- **POST**: Aanmaken maaltijd _/api/meal_
- **GET**: Ophalen maaltijden _/api/meal_
- **GET**: Ophalen specifieke maaltijd _/api/meal/{id van de maaltijd}_
- **PUT**: Informatie veranderen van een maaltijd _/api/meal/{id van de maaltijd}_
- **DELETE**: Verwijder informatie van een maaltijd _/api/meal/{id van de maaltijd}_

#### **Extra functie:**

Bij het ophalen van de gebruikers kan wordt gezocht op voornaam en op status van de gebruiker.
Dit kan door ?firstName={voornaam van de gebruiker}&isActive={0 voor inactief of 1 voor actief} achter het end-point te zetten.

Voorbeeld: _/api/user?firstName=Peter&isActive=1_

Je kunt ook het aantal resultaten limiteren door length te gebruiken

Voorbeeld: _/api/user/?isActive=1&length=2_


## Deze API maakt gebruik van de volgende frameworks en libraries

- ##### **Node.js**
- ##### **Express**
- ##### **Nodemon**
- ##### **Dotenv**
- ##### **Mocha**
- ##### **Chai**
- ##### **Assert**
- ##### **mysql2**
- ##### **JSON Web Token (JWT)**

## Hoe te gebruiken?

1. Download de repository
2. Download XAMPP en draai mysql
3. Voer -npm install- uit in de console
4. Voer -npm start- uit in de console
5. Gebruik een API request applicatie zoals bijvoorbeeld Postman

## Lokale integratietesten runnen

- _npm run test_ in de console
