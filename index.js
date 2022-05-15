const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0patr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

      

        app.get('/service', async(req, res) =>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })
        //warning
        //this api is getting information from service.
        //it will be after learning backend properly.)(aggregation)
        //this is not the proper way of query.
        app.get('/available', async(req, res) =>{
          const date = req.query.date;

          //step1 : get all services

          const services = await serviceCollection.find().toArray();

          //step2 : get the booking on that day
          const query = {date: date};
          const bookings = await bookingCollection.find(query).toArray();

          // step 3: for each service, find bookings for that service. 

          services.forEach(service => {
            //step 4: find bookings for that service
            const serviceBookings = bookings.filter(book => book.treatment === service.name);
            //step 5: select slots for the service service booking
            const bookedSlots = serviceBookings.map(book => book.slot);
            // step 6: select those slots that are not in bookedSlots.
            const available = service.slots.filter(slot => !bookedSlots.includes(slot));
            //step 7: set available to slots to make it easier
            service.slots = available;

          })

          res.send(services);

        })

        /* 
        * API naming convention
        * app.get('/booking') // get all booking in this collection. or get more than one or by filter 
        * app.get('/booking/:id') // get a specific booking
        * app.post('/booking') //add a new booking
        * app.patch('/booking/:id') // updating 
        * app.delete('/booking/:id') // deleting
        */

        app.get('/booking', async(req, res) =>{
          const patient = req.query.patient_email;
          const query = {patient: patient}
          const bookings = await bookingCollection.find(query).toArray();
          res.send(bookings);
        })

        app.post('/booking', async(req, res) =>{
          const booking = req.body;
          console.log(booking);
          const query = {treatment: booking.treatment , date: booking.date, patient: booking.patient_email}
          const exists = await bookingCollection.findOne(query);
          if(exists){
            return res.send({success: false, booking: exists})
          }
          const result = await bookingCollection.insertOne(booking)
          return res.send({success: true, result})
        })


    }
    finally{

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello From Doctor Uncle!')
})

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`)
})