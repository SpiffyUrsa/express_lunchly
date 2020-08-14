/** Routes for Lunchly */

//Imports
const express = require("express");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

//Router
const router = new express.Router();

/** Homepage: show list of customers. */
router.get("/", async function (req, res, next) {
  try {
    const customers = await Customer.all();
    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Show a list of customers matching the search term. */
router.post("/", async function (req, res, next) {
  try {
    let searchTerm = req.body.searchTerm;
    const customers = await Customer.getBySearch(searchTerm);
    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
})

/** Shows a list of the top ten customers by reservation volume. */
router.get('/topten', async function (req, res, next) {
  try {
    const customers = await Customer.getTopTenByReservations()
    return res.render('top_ten_customer_list.html', { customers })
  }
  catch (error) {
    return next(error)
  }
})

/** Form to add a new customer. */
router.get("/add/", async function (req, res, next) {
  try {
    return res.render("customer_new_form.html");
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new customer. */
router.post("/add/", async function (req, res, next) {
  try {
    const { firstName, lastName, phone, notes } = req.body;
    const customer = new Customer({ firstName, lastName, phone, notes });
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Show a customer, given their ID. */
router.get("/:id/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    const reservations = await customer.getReservations();

    return res.render("customer_detail.html", { customer, reservations });
  } catch (err) {
    return next(err);
  }
});

/** Show form to edit a customer. */
router.get("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id);

    res.render("customer_edit_form.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** Handle editing a customer. */
router.post("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.get(req.params.id); //destructuring
    customer.firstName = req.body.firstName;
    customer.lastName = req.body.lastName;
    customer.phone = req.body.phone;
    customer.notes = req.body.notes;
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new reservation. 
 * Accepts returns redirects
 * 
*/
router.post("/:id/add-reservation/", async function (req, res, next) {
  try {
    const customerId = req.params.id;
    const startAt = new Date(req.body.startAt);
    const numGuests = req.body.numGuests;
    const notes = req.body.notes;

    const reservation = new Reservation({
      customerId,
      startAt,
      numGuests,
      notes,
    });
    await reservation.save();

    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

//Export
module.exports = router;
