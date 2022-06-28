# Programmeren 4: Share-a-meal

## Introductie

Mijn naam is Joost van Dam, ik zit nu momenteel in mijn eerste jaar van de opleiding Informatica bij Avans Hogeschool in Breda. Voor het vak programmeren 4 hebben wij de opdracht gekregen om een API te maken voor de share-a-meal server. Met deze API kan je gebruikers en maaltijden toevoegen aan een database en deze opvragen.

De link naar mijn server: https://meal-a-share.herokuapp.com/

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
- **GET**: Ophalen maaltijd _/api/meal/{id van de maaltijd}_
- **PUT**: Informatie veranderen van een maaltijd _/api/meal/{id van de maaltijd}_
- **DELETE**: Verwijder informatie van een maaltijd _/api/meal/{id van de maaltijd}_

#### **Extra functie:**

Bij het ophalen van de gebruikers kan wordt gezocht op voornaam en op status van de gebruiker.
Dit kan door ?firstName={voornaam van de gebruiker}&isActive={0 voor inactief of 1 voor actief} achter het end-point te zetten.

Voorbeeld: _/api/user/firstName=Joost&isActive=1_

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

## Hoe gebruiken?

1. Download de repository
2. Download XAMPP en draai mysql
3. Voer -npm install- uit in de console
4. Voer -npm start- uit in de console

## Lokale integratietesten

- _npm run test_ in de console
