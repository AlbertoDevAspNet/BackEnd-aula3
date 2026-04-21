const mongoose = require('mongoose')

const connectDB= async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI,{

        });
        //await mongoose.connect(process.env.MONGO_URI)
        console.log('MongoDB connected: ${conn.connection.host}')
        //Monitoramento de eventos 
        mongoose.connection.on('error', (err)=>{
            console.error('Erro de conexao com MongoBB:', err)
        })


    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
    })
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
        process.exit(1)
    }

    module.exports = connectDB
}
