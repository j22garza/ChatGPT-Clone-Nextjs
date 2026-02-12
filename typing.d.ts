/** Tipo compartido para mensajes (cliente y servidor). En servidor createdAt es Timestamp; en cliente puede ser FieldValue o Timestamp. */
interface Message {
  text: string;
  createdAt: unknown;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}