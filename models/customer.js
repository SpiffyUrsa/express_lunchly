/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

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

  /** get a customer by ID. */

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
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a customer by name */

  static async getBySearch(searchTerm) {
    let searchTerms = searchTerm.split(" ");
    // this = Customer class. So can call other static methods.
    searchTerms = searchTerms.map(term => this.titleCase(term));
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
    selectStr = selectStr.slice(0, -3);

    const results = await db.query(selectStr, searchTerms);

    const customers = results.rows;

    if (customers === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }
    return customers.map(customer => new Customer(customer));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

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
  /** Returns a title cased name  */
  static titleCase(name) {
    name = name.toLowerCase();
    return name[0].toUpperCase() + name.slice(1);
  }
}

module.exports = Customer;
