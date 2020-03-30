DROP DATABASE IF EXISTS Restaurants;

CREATE DATABASE Restaurants;

USE Restaurants;

CREATE TABLE Restaurant(
	restCode NUMERIC(3) NOT NULL,
	restName VARCHAR(30) NOT NULL,
	cuisine VARCHAR(25) NOT NULL,
	borough VARCHAR(30) NOT NULL,
	yearEst SMALLINT NOT NULL CHECK (yearEst >= 1990 AND yearEst <= 2019),
	avgPrice NUMERIC(5,2) NOT NULL,
	CONSTRAINT Rest_pk PRIMARY KEY (restCode)
 );
 
CREATE TABLE Critic(
	cID NUMERIC(3) NOT NULL,
	firstN VARCHAR(25) NOT NULL,
	lastN VARCHAR(30) NOT NULL,
	affiliation VARCHAR(25),
	CONSTRAINT Critic_pk PRIMARY KEY (cID)
);

CREATE TABLE Rating(
	code CHAR(4) NOT NULL,
	cID NUMERIC(3) NOT NULL,
	restCode NUMERIC(3) NOT NULL,
	starRating NUMERIC(1) NOT NULL,
	ratingDate DATE ,
	comments VARCHAR(250),
	CONSTRAINT Rating_pk PRIMARY KEY (code),
	CONSTRAINT Rating_rID_fk FOREIGN KEY(cID) REFERENCES Critic(cID),
	CONSTRAINT Rating_restCode_fk FOREIGN KEY(restCode) REFERENCES Restaurant(restCode)
 );


ALTER TABLE Rating
 	ADD CHECK (starRating <= 5); 

INSERT INTO Restaurant VALUES (101, 'Pok Pok', 'Thai', 'Brooklyn',  2005, 100.00);
INSERT INTO Restaurant VALUES (102, 'Kiin Thai', 'Thai', 'Manhattan', 2013, 75.00);
INSERT INTO Restaurant VALUES (103, 'Carbone', 'Italian', 'Manhattan', 2010, 150.00);
INSERT INTO Restaurant VALUES (104, 'Il Mulino', 'Italian', 'Manhattan', 1999, 250.00);
INSERT INTO Restaurant VALUES (105, 'Don Peppe', 'Italian', 'Queens', 1998, 75.00);
INSERT INTO Restaurant VALUES (106, 'Loukoumi Taverna', 'Greek', 'Queens', 1994, 130.00);
INSERT INTO Restaurant VALUES (107, 'Nisi', 'Greek', 'Manhattan', 2014, 100.00);
INSERT INTO Restaurant VALUES (108, 'Ela Taverna', 'Greek', 'Brooklyn', 2015, 150.00);
INSERT INTO Restaurant VALUES (109, 'Jianbing Company', 'Chinese', 'Brooklyn', 2010, 75.00);
INSERT INTO Restaurant VALUES (110, 'Han Dynasty', 'Chinese', 'Manhattan', 2012, 125.00);
INSERT INTO Restaurant VALUES (111, 'Antonio Trattoria', 'Italian', 'Bronx', 2008, 75.00);

INSERT INTO Critic VALUES (201,'Sarah', 'Martinez','NYT');
INSERT INTO Critic VALUES (202,'Daniel', 'Lewis', 'WP');
INSERT INTO Critic VALUES (203,'Brittany', 'Harris', 'Vogue');
INSERT INTO Critic VALUES (204,'Mike', 'Anderson',NULL);
INSERT INTO Critic VALUES (205,'Chris', 'Jackson','NYT');
INSERT INTO Critic VALUES (206,'Elizabeth', 'Thomas','Chronicle');
INSERT INTO Critic VALUES (207,'James', 'Cameron','NYP');
INSERT INTO Critic VALUES (208,'Ashley', 'White','NYT');
INSERT INTO Critic (cID, lastN, firstN) VALUES (209, 'Clarke','George');
INSERT INTO Critic VALUES (210,'Sean', 'Thompson','NYP');

INSERT INTO Rating VALUES ('R1', 201,101,2,'2014-11-13', 'Good food, bad service');
INSERT INTO Rating VALUES ('R2', 201,101,4,'2017-01-15', 'Amazing deserts, so-so appetizers');
INSERT INTO Rating VALUES ('R3', 202,106,4,NULL, 'Great atmosphere, friendly staff');
INSERT INTO Rating VALUES ('R4', 203,103,2,'2015-02-01', 'Disappointed');
INSERT INTO Rating VALUES ('R5', 203,108,4,'2016-03-01', 'Great fish');
INSERT INTO Rating VALUES ('R6', 203,108,2,'2018-06-30', 'Not as good as before');
INSERT INTO Rating VALUES ('R7', 204,101,3,'2017-10-23', NULL);
INSERT INTO Rating VALUES ('R8', 205,103,3,'2012-02-16', NULL);
INSERT INTO Rating (code, cID, restCode,ratingDate,starRating) VALUES ('R9', 205,104,'2000-02-16',2);
INSERT INTO Rating (code, cID, restCode,starRating,comments) VALUES ('R10', 205,108,5, 'Must try fish');
INSERT INTO Rating VALUES ('R11', 206,107,3,'2016-07-02', 'Great food, rude staff');
INSERT INTO Rating VALUES ('R12', 206,106,5,'2001-12-21', 'Loved everything');
INSERT INTO Rating VALUES ('R13', 208,104,3,'2003-06-30', 'Overpriced');
INSERT INTO Rating VALUES ('R14', 209,104,3,'1005-07-30', NULL);
