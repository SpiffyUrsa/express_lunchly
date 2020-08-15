/** Customer for Lunchly */

//Imports
const db = require("../db");
const Reservation = require("./reservation");
const { NotFoundError } = require('../expressError')

/** Class representing a customer of the restaurant. */
class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes;
  }

  //Getter & Setters
  get notes() {
    return this._notes;
  }

  set notes(val) {
    if (!!val === false){
      this._notes = "testing";
      throw new Error("Notes should not be falsy");
    }
    else{
      this._notes = val;
    }
  }


  /** Gets and returns all customers. */
  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** Returns a customer given an ID. */
  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new NotFoundError(`No such customer: ${id}`);
      //err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** Returns matching customers given a search string. */
  static async getBySearch(searchTerm) {
    let searchTerms = searchTerm.split(" ");
    searchTerms = searchTerms.map(term => this.titleCase(term));

    //Construct SQL query for search string
    let selectStr = `SELECT id, 
                    first_name AS "firstName",
                    last_name AS "lastName", 
                    phone, 
                    notes
                    FROM customers
                    WHERE `;
    for (let i = 1; i < searchTerms.length + 1; i++) {
      selectStr += `first_name = $${i} OR last_name = $${i} OR `;
    }
    selectStr = selectStr.slice(0, -3); //use join() instead, would be more efficient; arbitrary slices harder to read

    const results = await db.query(selectStr, searchTerms);

    const customers = results.rows;

    if (customers === undefined) {
      const err = new NotFoundError(`No such customer: ${id}`);
      // err.status = 404;
      throw err;
    }
    return customers.map(customer => new Customer(customer));
  }

  /** Gets and returns all reservations for this customer instance. */
  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** Save the customer instance's data into the database. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** Returns a string that combines the first and last names joined by a space. */
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** Given a name, returns it in title case. */
  static titleCase(name) {
    name = name.toLowerCase();
    return name[0].toUpperCase() + name.slice(1);
  }

  /** Returns the top 10 customers by reservation volume. */
  static async getTopTenByReservations() { //Postgres always lowercases the column names unless otherwise
    const results = await db.query(`
      SELECT customers.id,
             first_name AS "firstName",
             last_name AS "lastName",
             customers.phone, customers.notes,
             COUNT(reservations.id) AS num_reservations
      FROM customers
      JOIN reservations
      ON customers.id = reservations.customer_id
      GROUP BY customers.id
      ORDER BY num_reservations DESC
      LIMIT 10;
      `)
    return results.rows.map(customer => new Customer(customer))
  }
}

//Exports
module.exports = Customer;
