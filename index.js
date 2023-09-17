const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./schemas/user');
const Category = require('./schemas/category');
const Task = require('./schemas/task');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'https://facite-three.vercel.app' }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the user already exists in the database
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({ error: 'User already exists, Please login.' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new instance of the User model with the received data
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the new user to the database
    await newUser.save();

        // Create a default category called "Personal" and associate it with the newly created user
        await Category.create({
          name: 'Personal',
          color: '#000000',
          user_id: newUser.id,
        });

    console.log('User saved to the database:', newUser);

    return res.json({ message: 'Your message has been received by the server.' });
  } catch (error) {
    console.error('Error saving user to the database:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ where: { email } });

    

    if (!user) {
      return res.json({ error: 'User not found, please validate your credentials or create an account.' });
    }

    // Compare the entered password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({ error: 'Password is incorrect.' });
    }

    // Generate and send the JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET, // Replace with your secret key
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Something went wrong, please try again.' });
  }
});

app.get('/api/categories/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch categories associated with the user
    const categories = await Category.findAll({ where: { user_id: userId } });

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/categories/AddCategory', async (req, res) => {
  const { name, color, userId } = req.body;

  try {
    const category = await Category.create({
      name,
      color,
      user_id: userId,
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/categories/DeleteCategory/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
    // Find the category by  its ID
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete the category from the database
    await category.destroy();

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks/AddTask', async (req, res) => {
  const { name, description, category_id, due_date, status } = req.body;
  try {
    const task = await Task.create({
      name,
      category_id,
      description,
      status,
      due_date,
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).json({ message: 'Server error' }); 
  }
})
app.get('/api/tasks/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch tasks associated with the user's categories
    const categories = await Category.findAll({
      where: { user_id: userId },
      include: Task,
    });

    // Extract tasks from categories and sort by creation or last update time
    const tasks = categories.reduce((allTasks, category) => {
      return allTasks.concat(category.Tasks);
    }, []);

    tasks.sort((taskA, taskB) => {
      const timeA = taskA.updatedAt || taskA.createdAt;
      const timeB = taskB.updatedAt || taskB.createdAt;
      return timeB - timeA;
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks/updateStatus', async (req, res) => {
  const { taskId, status } = req.body;

  try {
    // Find the task by ID
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update the status of the task
    task.status = status;
    await task.save();

    return res.status(200).json({ message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/deleteTask/:taskId', async (req, res) => {
  const id = req.params.taskId;

  try {
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();

    return res.status(200).json({ message: 'Task deleted successfully'});
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Server error' });
  }
})

app.get('/api/tasks/category/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
    // Fetch tasks associated with the category
    const tasks = await Task.findAll({
      where: {
        category_id: categoryId,
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks/id/:taskId', async (req, res) => {
  const taskId = req.params.taskId;

  try {
    // Fetch task details using the task ID
    const task = await Task.findByPk(taskId, {
      include: Category, // Include the associated category details
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/id/:taskId', async (req, res) => {
  const taskId = req.params.taskId;
  const updatedFields = req.body;

  try {
    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update the task fields with the provided values
    for (const field in updatedFields) {
      if (updatedFields.hasOwnProperty(field)) {
        task[field] = updatedFields[field];
      }
    }

    // Save the updated task
    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});