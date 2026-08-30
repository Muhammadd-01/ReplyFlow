import mongoose, { Schema } from 'mongoose';

const ContactSchema = new Schema({
  attributes: { type: Map, of: String }
});
const Contact = mongoose.model('TestContactMap', ContactSchema);

async function test() {
  const c = new Contact({ attributes: { id: '123' } });
  console.log("c.attributes:", c.attributes);
  console.log("c.attributes.id:", (c.attributes as any).id);
  console.log("c.attributes.get('id'):", (c.attributes as any).get('id'));
  console.log("c.toObject().attributes.id:", c.toObject().attributes.id);
  process.exit(0);
}
test();
