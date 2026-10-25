import mongoose from 'mongoose';

const EvidenceSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Evidence label is required'],
    trim: true,
    maxlength: [200, 'Evidence label cannot exceed 200 characters'],
  },
  url: {
    type: String,
    required: [true, 'Evidence URL is required'],
    trim: true,
    validate: {
      validator: function (v) {
        try {
          const parsed = new URL(v);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      message: (props) => `${props.value} is not a valid HTTP/HTTPS URL`,
    },
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const ObligationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Obligation title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [250, 'Title cannot exceed 250 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    owner: {
      type: String,
      required: [true, 'Responsible owner is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (v) {
          return !isNaN(new Date(v).getTime());
        },
        message: 'Invalid due date format',
      },
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Open', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Open',
    },
    evidenceRequired: {
      type: Boolean,
      default: true,
    },
    org: {
      type: String,
      trim: true,
      default: 'General Organization',
      index: true,
    },
    evidence: [EvidenceSchema],
  },
  {
    timestamps: true,
  }
);

// Index for search and query performance
ObligationSchema.index({ title: 'text', owner: 'text', category: 'text' });
ObligationSchema.index({ org: 1, status: 1, priority: 1, dueDate: 1 });

export const Obligation = mongoose.model('Obligation', ObligationSchema);
export default Obligation;
