import mongoose from 'mongoose';
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      delete (ret as any)._id;
      delete (ret as any).__v;
    }
  });
});
const SessionSchema = new mongoose.Schema({ sessionName: String });
const Session = mongoose.model('TestSession', SessionSchema);
async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/replyflow');
  const s = new Session({ sessionName: 'Test' });
  await s.save();
  const docs = await Session.find();
  console.log(JSON.stringify(docs));
  process.exit(0);
}
run();
